import Link from "next/link";
import { getCurricula } from "@/lib/curriculum-data";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const curricula = await getCurricula();

  return (
    <main className="min-h-full bg-[#FAFAF7] text-[#1A1A18]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-12">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8A8578] mb-2">
            Curriculum Builder · Admin
          </p>
          <h1 className="font-serif text-3xl leading-tight">Your curricula</h1>
        </header>

        {curricula.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#D8D4C8] px-6 py-12 text-center">
            <p className="text-[#5A564A]">
              Nothing here yet. Run <code className="px-1.5 py-0.5 bg-[#F0EDE3] rounded text-sm">npm run seed</code> to
              load the Chemistry curriculum from Phase 0.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {curricula.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/curriculum/${c.id}`}
                  className="group flex items-center justify-between rounded-md border border-[#E7E3D7] bg-white px-5 py-4 transition hover:border-[#B8753D] hover:shadow-sm"
                >
                  <div>
                    <p className="font-serif text-lg">{c.title}</p>
                    <p className="text-sm text-[#8A8578] mt-0.5">
                      {c.subject} ·{" "}
                      <span
                        className={
                          c.status === "published"
                            ? "text-[#3D7A4F]"
                            : c.status === "archived"
                            ? "text-[#8A8578]"
                            : "text-[#B8753D]"
                        }
                      >
                        {c.status}
                      </span>
                      {c.source_attribution ? ` · adapted from ${c.source_attribution}` : ""}
                    </p>
                  </div>
                  <span className="text-[#B8753D] opacity-0 group-hover:opacity-100 transition">
                    Open →
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
