import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH /api/resources/[id] -- update a resource's review status.
// RLS (admin-only writes) is the real enforcement here; this route
// just validates the shape of the request.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { status } = body;

  if (!status || !["draft", "approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "status must be one of: draft, approved, rejected" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("resources")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resource: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}