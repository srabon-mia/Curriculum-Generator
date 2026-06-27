import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();

  const { topic, grade_level, difficulty, existing_knowledge, learning_goal, time_available, added_context } = body;

  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  // Cache check — normalize topic to catch "AP Chemistry" vs "ap chemistry"
  const normalized = topic.trim().toLowerCase();
  const { data: existing } = await supabase
    .from("curricula")
    .select("id, status")
    .ilike("title", `%${normalized}%`)
    .eq("status", "published")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ curriculum_id: existing.id, cached: true });
  }

  // Create a pending curriculum record
  const { data, error } = await supabase
    .from("curricula")
    .insert({
      title: topic.trim(),
      subject: topic.trim(),
      source_type: "ai_organized",
      status: "draft",
      notes: JSON.stringify({
        grade_level,
        difficulty,
        existing_knowledge,
        learning_goal,
        time_available,
        added_context,
      }),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ curriculum_id: data.id, cached: false });
}