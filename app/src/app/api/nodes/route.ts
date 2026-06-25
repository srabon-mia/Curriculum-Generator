import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/nodes?curriculum_id=... -- list nodes (with their major
// understandings nested) for a given curriculum.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const curriculumId = searchParams.get("curriculum_id");

  if (!curriculumId) {
    return NextResponse.json(
      { error: "curriculum_id query param is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("nodes")
    .select("*, major_understandings(*)")
    .eq("curriculum_id", curriculumId)
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort nested major_understandings by order_index too --
  // Supabase doesn't support ordering on nested resources directly.
  const sorted = data?.map((node) => ({
    ...node,
    major_understandings: [...(node.major_understandings ?? [])].sort(
      (a, b) => a.order_index - b.order_index
    ),
  }));

  return NextResponse.json({ nodes: sorted });
}

// POST /api/nodes -- create a node within a curriculum.
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { curriculum_id, title, order_index, external_key, exam_weight_pct, claim_statement } =
    body;

  if (!curriculum_id || !title || order_index === undefined) {
    return NextResponse.json(
      { error: "curriculum_id, title, and order_index are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("nodes")
    .insert({
      curriculum_id,
      title,
      order_index,
      external_key,
      exam_weight_pct,
      claim_statement,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ node: data }, { status: 201 });
}
