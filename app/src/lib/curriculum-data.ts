import { createClient } from "@/lib/supabase/server";

export type MajorUnderstanding = {
  id: string;
  node_id: string;
  external_key: string | null;
  code: string | null;
  description: string;
  order_index: number;
};

export type Resource = {
  id: string;
  node_id: string | null;
  major_understanding_id: string | null;
  url: string;
  title: string;
  source_domain: string | null;
  resource_type: string;
  license_status: "cc_open" | "link_only" | "unknown_review_needed";
  embed_allowed: boolean;
  ai_note: string | null;
  status: "draft" | "approved" | "rejected";
  created_at: string;
};

export type NodeWithChildren = {
  id: string;
  curriculum_id: string;
  external_key: string | null;
  title: string;
  order_index: number;
  exam_weight_pct: string | null;
  claim_statement: string | null;
  major_understandings: MajorUnderstanding[];
};

export type Curriculum = {
  id: string;
  title: string;
  subject: string;
  source_type: "adapted" | "ai_organized";
  source_attribution: string | null;
  source_url: string | null;
  status: "draft" | "published" | "archived";
};

export async function getCurricula(): Promise<Curriculum[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("curricula")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load curricula: ${error.message}`);
  return data ?? [];
}

export async function getCurriculum(id: string): Promise<Curriculum | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("curricula")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load curriculum: ${error.message}`);
  return data;
}

export async function getNodesWithUnderstandings(
  curriculumId: string
): Promise<NodeWithChildren[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nodes")
    .select("*, major_understandings(id, node_id, external_key, code, description, order_index)")
    .eq("curriculum_id", curriculumId)
    .order("order_index", { ascending: true });

  if (error) throw new Error(`Failed to load nodes: ${error.message}`);

  return (data ?? []).map((node) => ({
    ...node,
    major_understandings: [...(node.major_understandings ?? [])].sort(
      (a: MajorUnderstanding, b: MajorUnderstanding) => a.order_index - b.order_index
    ),
  }));
}

export async function getResourcesForTargets(
  nodeIds: string[],
  muIds: string[]
): Promise<Resource[]> {
  const supabase = await createClient();

  const results: Resource[] = [];

  if (nodeIds.length > 0) {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .in("node_id", nodeIds);
    if (error) throw new Error(`Failed to load node resources: ${error.message}`);
    results.push(...(data ?? []));
  }

  if (muIds.length > 0) {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .in("major_understanding_id", muIds);
    if (error) throw new Error(`Failed to load MU resources: ${error.message}`);
    results.push(...(data ?? []));
  }

  return results;
}

export async function getDomainScores(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("domain_scores").select("domain, score");
  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.domain] = row.score;
  }
  return map;
}