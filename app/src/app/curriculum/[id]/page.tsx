import { notFound } from "next/navigation";
import {
  getCurriculum,
  getNodesWithUnderstandings,
  getResourcesForTargets,
  type Resource,
} from "@/lib/curriculum-data";
import { CurriculumViewer } from "@/components/CurriculumViewer";

export const dynamic = "force-dynamic";

export default async function CurriculumViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const curriculum = await getCurriculum(id);
  if (!curriculum || curriculum.status !== "published") notFound();

  const nodes = await getNodesWithUnderstandings(id);

  const nodeIds = nodes.map((n) => n.id);
  const muIds = nodes.flatMap((n) =>
    n.major_understandings.map((mu) => mu.id)
  );
  const allResources = await getResourcesForTargets(nodeIds, muIds);

  const approved = allResources.filter((r) => r.status === "approved");

  const resourcesByTarget: Record<string, Resource[]> = {};
  for (const r of approved) {
    const key = r.node_id
      ? `node:${r.node_id}`
      : `mu:${r.major_understanding_id}`;
    if (!resourcesByTarget[key]) resourcesByTarget[key] = [];
    resourcesByTarget[key].push(r);
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A18]">
      <header className="border-b border-[#E7E3D7] bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8A8578] mb-0.5">
            {curriculum.subject}
          </p>
          <h1 className="font-serif text-xl leading-tight">{curriculum.title}</h1>
        </div>
        {curriculum.source_attribution && (
          <p className="text-xs text-[#8A8578] hidden sm:block max-w-xs text-right">
            Adapted from{" "}
            {curriculum.source_url ? (
              <a
                href={curriculum.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#D8D4C8] hover:text-[#1A1A18]"
              >
                {curriculum.source_attribution}
              </a>
            ) : (
              curriculum.source_attribution
            )}
          </p>
        )}
      </header>

      <CurriculumViewer nodes={nodes} resourcesByTarget={resourcesByTarget} />
    </div>
  );
}