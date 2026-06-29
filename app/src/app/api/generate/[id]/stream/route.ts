import { createClient as createServiceClient } from "@supabase/supabase-js";
import { buildSkeletonPrompt } from "@/lib/prompts/skeleton";
import { buildDiscoverPrompt, buildTopicBatchPrompt } from "@/lib/prompts/discover";

const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300;

async function callClaude(prompt: string, useSearch = true) {
  let lastErr = "";

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      const waitMs = attempt * 30000;
      await new Promise((r) => setTimeout(r, waitMs));
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        ...(useSearch && {
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (res.status === 429) {
      lastErr = await res.text();
      continue;
    }

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    const textBlocks = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text);

    const allText = textBlocks.join("");
    return allText;
  }

  throw new Error(`Rate limited after retries: ${lastErr}`);
}

function extractJSON(text: string, arrayMode = false): unknown {
  const pattern = arrayMode ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[0]);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();

  function send(
    controller: ReadableStreamDefaultController,
    event: string,
    data: unknown
  ) {
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Get the curriculum record
        const { data: curriculum } = await supabase
          .from("curricula")
          .select("*")
          .eq("id", id)
          .single();

        if (!curriculum) {
          send(controller, "error", { message: "Curriculum not found" });
          controller.close();
          return;
        }

        const notes = curriculum.notes ? JSON.parse(curriculum.notes) : {};

        // Step 1: Generate skeleton
        send(controller, "status", {
          message: "Finding the best curriculum structure…",
          step: "skeleton",
        });

        const skeletonPrompt = buildSkeletonPrompt(
          curriculum.title,
          notes.grade_level ?? "high school",
          notes.difficulty ?? "standard",
          notes.existing_knowledge ?? "",
          notes.learning_goal ?? "understand the subject",
          notes.time_available ?? "no time pressure",
          notes.added_context ?? ""
        );

        const skeletonText = await callClaude(skeletonPrompt, true);

        let skeleton: {
          title: string;
          source_type: string;
          source_attribution: string | null;
          source_url: string | null;
          nodes: Array<{
            title: string;
            order_index: number;
            major_understandings: Array<{
              code: string | null;
              description: string;
            }>;
          }>;
        };

        try {
          skeleton = extractJSON(skeletonText) as typeof skeleton;
        } catch {
          send(controller, "error", {
            message: "Failed to generate curriculum structure",
          });
          controller.close();
          return;
        }

        // Update curriculum with real title and attribution
        await supabase
          .from("curricula")
          .update({
            title: skeleton.title,
            source_type: skeleton.source_type,
            source_attribution: skeleton.source_attribution,
            source_url: skeleton.source_url,
          })
          .eq("id", id);

        send(controller, "skeleton", {
          title: skeleton.title,
          topic_count: skeleton.nodes.length,
        });

        // Step 2: Insert nodes and major understandings
        const nodeIds: Array<{
          nodeId: string;
          node: (typeof skeleton.nodes)[0];
        }> = [];

        for (const node of skeleton.nodes) {
          const { data: nodeRow } = await supabase
            .from("nodes")
            .insert({
              curriculum_id: id,
              title: node.title,
              order_index: node.order_index,
            })
            .select("id")
            .single();

          if (!nodeRow) continue;

          const mus = node.major_understandings.map((mu, i) => ({
            node_id: nodeRow.id,
            external_key: mu.code ?? `${node.order_index}.${i + 1}`,
            code: mu.code,
            description: mu.description,
            order_index: i,
          }));

          await supabase.from("major_understandings").insert(mus);
          nodeIds.push({ nodeId: nodeRow.id, node });
        }

        // Step 3: Discover resources per topic
        for (let i = 0; i < nodeIds.length; i++) {
          const { nodeId, node } = nodeIds[i];

          send(controller, "status", {
            message: `Finding resources for: ${node.title}`,
            step: "discovery",
            current: i + 1,
            total: nodeIds.length,
          });

          // Get the inserted MUs for this node
          const { data: muRows } = await supabase
            .from("major_understandings")
            .select("id, code, description")
            .eq("node_id", nodeId);

          if (!muRows) continue;

          // Discover topic-level resources
          try {
            const topicPrompt = buildDiscoverPrompt(
                {
                    id: nodeId,
                    curriculum_id: id,
                    external_key: null,
                    title: node.title,
                    order_index: node.order_index,
                    exam_weight_pct: null,
                    claim_statement: null,
                    major_understandings: (muRows ?? []).map((mu) => ({
                    id: mu.id,
                    node_id: nodeId,
                    external_key: mu.code ?? null,
                    code: mu.code ?? null,
                    description: mu.description,
                    order_index: 0,
                    })),
                } as import("@/lib/curriculum-data").NodeWithChildren,
                "topic"
            );

            const topicText = await callClaude(topicPrompt, true);
            const candidates = extractJSON(topicText, true) as Array<{
              url: string;
              title: string;
              resource_type: string;
              source_domain: string;
              ai_note: string;
              license_status: string;
            }>;

            if (Array.isArray(candidates)) {
              const resources = candidates
                .filter((c) => c.url && c.title)
                .map((c) => ({
                  node_id: nodeId,
                  major_understanding_id: null,
                  url: c.url,
                  title: c.title,
                  source_domain: c.source_domain ?? "",
                  resource_type: c.resource_type ?? "other",
                  license_status: c.license_status ?? "link_only",
                  embed_allowed: false,
                  ai_note: c.ai_note ?? null,
                  content_type_verified: true,
                  status: "approved", // auto-approve for user-generated curricula
                }));

              if (resources.length > 0) {
                await supabase.from("resources").insert(resources);
              }
            }
          } catch (err) {
            console.log(`Resource discovery failed for topic "${node.title}":`, err);
            // Continue to next topic
          }

          // Delay between topics to avoid rate limiting
          // 45s gives the token bucket time to refill between web search calls
          if (i < nodeIds.length - 1) {
            await new Promise((r) => setTimeout(r, 45000));
          }
        }

        // Publish the curriculum
        await supabase
          .from("curricula")
          .update({ status: "published" })
          .eq("id", id);

        send(controller, "complete", { curriculum_id: id });

        // Kick off background per-understanding discovery
        // Fire and forget — don't await, let it run after the stream closes
        // Background per-understanding discovery — one call per topic
        (async () => {
          for (let i = 0; i < nodeIds.length; i++) {
            const { nodeId, node } = nodeIds[i];

            const { data: muRows } = await supabase
              .from("major_understandings")
              .select("id, code, description, external_key")
              .eq("node_id", nodeId);

            if (!muRows || muRows.length === 0) continue;

            try {
              const prompt = buildTopicBatchPrompt({
                id: nodeId,
                curriculum_id: id,
                external_key: null,
                title: node.title,
                order_index: node.order_index,
                exam_weight_pct: null,
                claim_statement: null,
                major_understandings: muRows.map((m) => ({
                  id: m.id,
                  node_id: nodeId,
                  external_key: m.external_key ?? m.code ?? null,
                  code: m.code ?? null,
                  description: m.description,
                  order_index: 0,
                })),
              } as import("@/lib/curriculum-data").NodeWithChildren);

              const text = await callClaude(prompt, true);
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (!jsonMatch) continue;

              const parsed = JSON.parse(jsonMatch[0]) as {
                topic_resources: Array<{
                  url: string;
                  title: string;
                  resource_type: string;
                  source_domain: string;
                  ai_note: string;
                  license_status: string;
                  understanding_codes: string[];
                }>;
              };

              if (!Array.isArray(parsed.topic_resources)) continue;

              for (const candidate of parsed.topic_resources) {
                if (!candidate.url || !candidate.title) continue;

                // Find which MUs this resource covers
                const coveredMuIds = muRows
                  .filter((mu) =>
                    candidate.understanding_codes?.some(
                      (code) => code === mu.code || code === mu.external_key
                    )
                  )
                  .map((mu) => mu.id);

                // If no specific understandings matched, attach to all of them
                const targetMuIds =
                  coveredMuIds.length > 0 ? coveredMuIds : muRows.map((m) => m.id);

                const resources = targetMuIds.map((muId) => ({
                  node_id: null,
                  major_understanding_id: muId,
                  url: candidate.url,
                  title: candidate.title,
                  source_domain: candidate.source_domain ?? "",
                  resource_type: candidate.resource_type ?? "other",
                  license_status: candidate.license_status ?? "link_only",
                  embed_allowed: false,
                  ai_note: candidate.ai_note ?? null,
                  content_type_verified: true,
                  status: "approved",
                }));

                if (resources.length > 0) {
                  await supabase.from("resources").insert(resources);
                }
              }
            } catch (err) {
              console.log(`Batch discovery failed for topic "${node.title}":`, err);
            }

            // 15 seconds between topics — much faster than per-understanding
            if (i < nodeIds.length - 1) {
              await new Promise((r) => setTimeout(r, 15000));
            }
          }
        })();

        controller.close();
      } catch (err) {
        send(controller, "error", {
          message: err instanceof Error ? err.message : "Something went wrong",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}