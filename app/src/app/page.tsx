import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#1A1A18]">
      {/* Nav */}
      <nav className="border-b border-[#E7E3D7] px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-lg">Curriculum Generator</span>
        <div className="flex items-center gap-4">
          <Link
            href="/curriculum"
            className="text-sm text-[#5A564A] hover:text-[#1A1A18] transition"
          >
            Browse
          </Link>
          <Link
            href="/admin"
            className="text-sm px-3 py-1.5 rounded-md border border-[#D8D4C8] text-[#5A564A] hover:border-[#1A1A18] transition"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8A8578] mb-4">
          Human-curated · AI-organized
        </p>
        <h1 className="font-serif text-5xl leading-tight mb-6">
          Study guides built from real resources
        </h1>
        <p className="text-lg text-[#5A564A] leading-relaxed mb-10">
          Every resource here was found and vetted by a real teacher — no
          AI-generated content. Just the best existing explanations, videos,
          and practice problems, organized by topic.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/curriculum"
            className="px-6 py-3 rounded-md bg-[#1A1A18] text-white text-sm hover:bg-[#3D3A30] transition"
          >
            Browse curricula
          </Link>
          <Link
            href="/curriculum"
            className="text-sm text-[#8A8578] hover:text-[#1A1A18] transition"
          >
            NYS Regents Chemistry →
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-2xl mx-auto px-6 py-16 border-t border-[#E7E3D7]">
        <h2 className="font-serif text-2xl mb-8">How it works</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Real curriculum",
              body: "Topics are structured around official curricula from NYSED and other reputable sources — not AI-generated outlines.",
            },
            {
              step: "02",
              title: "Curated resources",
              body: "Every link is sourced from trusted educational sites, reviewed by a human before it goes live.",
            },
            {
              step: "03",
              title: "Practice included",
              body: "Each concept comes with learning resources and separate practice problems so you can actually test yourself.",
            },
          ].map((item) => (
            <div key={item.step}>
              <p className="text-xs font-mono text-[#B8753D] mb-2">{item.step}</p>
              <h3 className="font-serif text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-[#5A564A] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E7E3D7] px-6 py-6 text-xs text-[#8A8578] flex items-center justify-between">
        <span>Curriculum Generator — human-curated study guides</span>
        <Link href="/curriculum" className="hover:text-[#1A1A18] transition">
          Browse →
        </Link>
      </footer>
    </main>
  );
}