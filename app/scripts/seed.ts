/**
 * scripts/seed.ts
 *
 * Loads Phase 0's seed_curriculum.json and domain_scorelist.json into
 * Supabase. Uses the SERVICE ROLE key (bypasses RLS) since this is a
 * one-time admin operation, not a user-facing request.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Idempotent: re-running this updates existing rows (matched by
 * external_key / domain) rather than creating duplicates, so it's safe
 * to run again after editing the source JSON files.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Seed files live in the project root, one level up from app/.
const SEED_CURRICULUM_PATH = join(__dirname, "../../seed_curriculum.json");
const DOMAIN_SCORELIST_PATH = join(__dirname, "../../domain_scorelist.json");

async function seedCurriculum() {
  const raw = JSON.parse(readFileSync(SEED_CURRICULUM_PATH, "utf-8"));

  console.log(`Seeding curriculum: ${raw.curriculum.title}`);

  // Upsert the curriculum itself. No external_key/unique constraint on
  // curricula in the schema, so we match on title to stay idempotent.
  const { data: existing } = await supabase
    .from("curricula")
    .select("id")
    .eq("title", raw.curriculum.title)
    .maybeSingle();

  let curriculumId: string;

  if (existing) {
    curriculumId = existing.id;
    await supabase
      .from("curricula")
      .update({
        subject: raw.curriculum.subject,
        source_type: raw.curriculum.source_type,
        source_attribution: raw.curriculum.source_attribution,
        source_url: raw.curriculum.source_url,
        notes: raw.curriculum.notes,
      })
      .eq("id", curriculumId);
    console.log(`  Updated existing curriculum (${curriculumId})`);
  } else {
    const { data, error } = await supabase
      .from("curricula")
      .insert({
        title: raw.curriculum.title,
        subject: raw.curriculum.subject,
        source_type: raw.curriculum.source_type,
        source_attribution: raw.curriculum.source_attribution,
        source_url: raw.curriculum.source_url,
        notes: raw.curriculum.notes,
        status: "draft", // stays draft until manually reviewed + published
      })
      .select("id")
      .single();

    if (error) throw error;
    curriculumId = data.id;
    console.log(`  Created new curriculum (${curriculumId})`);
  }

  // Upsert each node (topic) and its major understandings.
  for (const node of raw.nodes) {
    const { data: nodeRow, error: nodeError } = await supabase
      .from("nodes")
      .upsert(
        {
          curriculum_id: curriculumId,
          external_key: node.node_id,
          title: node.title,
          order_index: node.order_index,
          exam_weight_pct: node.exam_weight_pct ?? null,
          claim_statement: node.claim_statement ?? null,
        },
        { onConflict: "curriculum_id,external_key" }
      )
      .select("id")
      .single();

    if (nodeError) throw nodeError;

    const muList = node.major_understandings ?? node.sub_points ?? [];

    for (let i = 0; i < muList.length; i++) {
      const mu = muList[i];
      const { error: muError } = await supabase.from("major_understandings").upsert(
        {
          node_id: nodeRow.id,
          external_key: mu.key ?? mu.pe_code ?? `${node.node_id}-${i}`,
          code: mu.code ?? mu.pe_code ?? null,
          description: mu.description,
          order_index: i,
        },
        { onConflict: "node_id,external_key" }
      );

      if (muError) throw muError;
    }

    console.log(`  Topic "${node.title}": ${muList.length} major understandings`);
  }

  console.log("Curriculum seed complete.\n");
}

async function seedDomainScores() {
  const raw = JSON.parse(readFileSync(DOMAIN_SCORELIST_PATH, "utf-8"));

  console.log(`Seeding ${raw.domains.length} domain scores...`);

  for (const d of raw.domains) {
    const { error } = await supabase.from("domain_scores").upsert(
      {
        domain: d.domain,
        score: d.score,
        category: d.category,
        notes: d.notes,
      },
      { onConflict: "domain" }
    );

    if (error) throw error;
  }

  console.log("Domain scorelist seed complete.\n");
}

async function main() {
  try {
    await seedCurriculum();
    await seedDomainScores();
    console.log("✅ All seed data loaded successfully.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
