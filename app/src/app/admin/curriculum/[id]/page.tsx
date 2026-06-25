import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCurriculum,
  getNodesWithUnderstandings,
  getResourcesForTargets,
  type Resource,
} from "@/lib/curriculum-data";
import { CurriculumBuilder } from "@/components/CurriculumBuilder";

export const dynamic = "force-dynamic";

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const curriculum = await getCurriculum(id);
  if (!curriculum) notFound();

  const nodes = await getNodesWithUnderstandings(id);

  const nodeIds = nodes.map((n) => n.id);
  const muIds = nodes.flatMap((n) => n.major_understandings.map((mu) => mu.id));
  const allResources = await getResourcesForTargets(nodeIds, muIds);

  const resourcesByTarget: Record<string, Resource[]> = {};
  for (const r of allResources) {
    const key = r.node_id ? `node:${r.node_id}` : `mu:${r.major_understanding_id}`;
    if (!resourcesByTarget[key]) resourcesByTarget[key] = [];
    resourcesByTarget[key].push(r);
  }

  return (
    <div className="min-h-full bg-white">
      <header className="border-b border-[#E7E3D7] px-6 py-3 flex items-center justify-between">
        <div>
          <a href="/admin" className="text-xs text-[#8A8578] hover:text-[#1A1A18]">
            ← All curricula
          </a>
          <h1 className="font-serif text-lg leading-tight">{curriculum.title}</h1>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full ${
            curriculum.status === "published"
              ? "bg-[#E8F2EA] text-[#3D7A4F]"
              : "bg-[#FBF3E6] text-[#B8753D]"
          }`}
        >
          {curriculum.status}
        </span>
      </header>

      <CurriculumBuilder nodes={nodes} resourcesByTarget={resourcesByTarget} curriculumId={id} />
    </div>
  );
}