import Link from "next/link";
import { getCurricula } from "@/lib/curriculum-data";

export const dynamic = "force-dynamic";

export default async function CurriculaIndexPage() {
  const all = await getCurricula();
  const published = all.filter((c) => c.status === "published");

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#1A1A18]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-12">
          <h1 className="font-serif text-4xl leading-tight mb-3">
            Curriculum guides
          </h1>
          <p className="text-[#5A564A] leading-relaxed">
            Human-sourced study guides for specialized high school students.
            Every resource here was curated by a real teacher — no AI-generated
            content.
          </p>
        </header>

        {published.length === 0 ? (
          <p className="text-[#8A8578]">No curricula published yet.</p>
        ) : (
          <ul className="space-y-3">
            {published.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/curriculum/${c.id}`}
                  className="group flex items-center justify-between rounded-md border border-[#E7E3D7] bg-white px-6 py-5 transition hover:border-[#B8753D] hover:shadow-sm"
                >
                  <div>
                    <p className="font-serif text-xl">{c.title}</p>
                    {c.source_attribution && (
                      <p className="text-sm text-[#8A8578] mt-1">
                        Adapted from {c.source_attribution}
                      </p>
                    )}
                  </div>
                  <span className="text-[#B8753D] opacity-0 group-hover:opacity-100 transition text-lg">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}