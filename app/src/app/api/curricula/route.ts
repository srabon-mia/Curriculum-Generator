import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/curricula -- list curricula.
// RLS handles visibility: published for anyone, drafts only for admins.
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curricula")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ curricula: data });
}

// POST /api/curricula -- create a new curriculum.
// RLS will reject this for non-admins automatically.
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { title, subject, source_type, source_attribution, source_url, notes } = body;

  if (!title || !subject || !source_type) {
    return NextResponse.json(
      { error: "title, subject, and source_type are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("curricula")
    .insert({ title, subject, source_type, source_attribution, source_url, notes })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ curriculum: data }, { status: 201 });
}
