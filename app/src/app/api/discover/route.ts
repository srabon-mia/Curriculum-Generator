import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { buildDiscoverPrompt } from "@/lib/prompts/discover";
import { getNodesWithUnderstandings, getDomainScores } from "@/lib/curriculum-data";

export const maxDuration = 60;

type ResourceCandidate = {
  url: string;
  title: string;
  resource_type: string;
  source_domain: string;
  ai_note: string;
  license_status: "cc_open" | "link_only" | "unknown_review_needed";
};

const VALID_TYPES = [
  "video", "text", "textbook", "problem_set",
  "reference_tool", "practice_exam", "other"
];

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { node_id, curriculum_id, granularity, major_understanding_id } = body;

  console.log("Discover called:", { node_id, curriculum_id, granularity, major_understanding_id });

  if (!node_id || !curriculum_id) {
    return NextResponse.json(
      { error: "node_id and curriculum_id are required" },
      { status: 400 }
    );
  }

  const nodes = await getNodesWithUnderstandings(curriculum_id);
  const node = nodes.find((n) => n.id === node_id);
  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  const { data: curriculumRow } = await supabase
    .from("curricula")
    .select("title")
    .eq("id", curriculum_id)
    .single();

  const curriculumTitle = curriculumRow?.title ?? "the course";

  const mu = major_understanding_id
    ? node.major_understandings.find((m) => m.id === major_understanding_id)
    : null;

  console.log("Found MU:", mu ? { id: mu.id, code: mu.code } : null);

  const prompt = buildDiscoverPrompt(
    node,
    granularity ?? "topic",
    mu?.code ?? undefined,
    mu?.description ?? undefined,
    curriculumTitle,
    []
  );

  let anthropicData;
  let lastErr = "";

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      const waitMs = attempt * 30000; // 30s, 60s, 90s
      console.log(`Rate limited, waiting ${waitMs / 1000}s before retry ${attempt}...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (anthropicRes.status === 429) {
      lastErr = await anthropicRes.text();
      continue; // retry
    }

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.log("Anthropic error:", err);
      return NextResponse.json(
        { error: `Anthropic API error: ${err}` },
        { status: 500 }
      );
    }

    anthropicData = await anthropicRes.json();
    break;
  }

  if (!anthropicData) {
    console.log("All retries exhausted:", lastErr);
    return NextResponse.json(
      { error: "Rate limited after retries — wait a minute and try again" },
      { status: 429 }
    );
  }

  console.log("Anthropic stop reason:", anthropicData.stop_reason);
  console.log("Content blocks:", anthropicData.content?.map((b: {type: string}) => b.type));

  const textBlocks = anthropicData.content
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text);

  // Extract JSON array from wherever it appears in the text
  // Claude sometimes wraps it in prose, sometimes returns it clean
  const allText = textBlocks.join("");
  const jsonMatch = allText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.log("No JSON array found in response:", allText.slice(0, 300));
    return NextResponse.json(
      { error: "No JSON array found in Claude response", raw: allText },
      { status: 500 }
    );
  }

  let candidates: ResourceCandidate[] = [];
  try {
    candidates = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(candidates)) throw new Error("Not an array");
  } catch (e) {
    console.log("Parse error:", e, "matched text:", jsonMatch[0].slice(0, 300));
    return NextResponse.json(
      { error: "Failed to parse Claude response as JSON", raw: jsonMatch[0] },
      { status: 500 }
    );
  }

  console.log(`Parsed ${candidates.length} candidates`);

  const domainScores = await getDomainScores();
  const inserted: string[] = [];
  const skipped: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.url || !candidate.title) {
      skipped.push(candidate.url ?? "unknown");
      continue;
    }

    const resourceType = VALID_TYPES.includes(candidate.resource_type)
      ? candidate.resource_type
      : "other";

    const domain = candidate.source_domain ?? "";
    const domainScore = domainScores[domain] ?? 2;
    const embedAllowed =
      candidate.license_status === "cc_open" && domainScore >= 4;

    console.log("Inserting:", {
      url: candidate.url,
      node_id: mu ? null : node_id,
      major_understanding_id: mu ? mu.id : null,
    });

    const { error } = await supabase.from("resources").insert({
      node_id: mu ? null : node_id,
      major_understanding_id: mu ? mu.id : null,
      url: candidate.url,
      title: candidate.title,
      source_domain: domain,
      resource_type: resourceType,
      license_status: candidate.license_status ?? "link_only",
      embed_allowed: embedAllowed,
      ai_note: candidate.ai_note ?? null,
      content_type_verified: true,
      status: "draft",
    });

    if (error) {
      console.log("Insert error:", error.message, "for url:", candidate.url);
      skipped.push(candidate.url);
    } else {
      inserted.push(candidate.url);
    }
  }

  console.log(`Inserted: ${inserted.length}, Skipped: ${skipped.length}`);

  return NextResponse.json({
    inserted: inserted.length,
    skipped: skipped.length,
    message: `${inserted.length} resources added to review queue`,
  });
}