"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

type Status = {
  message: string;
  step: string;
  current?: number;
  total?: number;
};

type LogEntry = {
  message: string;
  done: boolean;
};

export default function GeneratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<Status>({
    message: "Starting…",
    step: "init",
  });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [skeletonTitle, setSkeletonTitle] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/generate/${id}/stream`);

    es.addEventListener("status", (e) => {
      const data = JSON.parse(e.data) as Status;
      setStatus(data);
      setLog((prev) => [...prev, { message: data.message, done: false }]);
    });

    es.addEventListener("skeleton", (e) => {
      const data = JSON.parse(e.data) as {
        title: string;
        topic_count: number;
      };
      setSkeletonTitle(data.title);
      setLog((prev) => [
        ...prev.slice(0, -1),
        {
          message: `Found structure: ${data.title} (${data.topic_count} topics)`,
          done: true,
        },
      ]);
    });

    es.addEventListener("complete", () => {
      es.close();
      router.push(`/curriculum/${id}`);
    });

    es.addEventListener("error", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as {
          message: string;
        };
        setError(data.message);
      } catch {
        setError("Something went wrong — please try again");
      }
      es.close();
    });

    return () => es.close();
  }, [id, router]);

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#1A1A18] flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {error ? (
          <div>
            <p className="font-serif text-2xl mb-3 text-[#B8453D]">
              Something went wrong
            </p>
            <p className="text-sm text-[#5A564A] mb-6">{error}</p>
            <a
              href="/"
              className="text-sm underline decoration-[#D8D4C8] hover:text-[#B8753D]"
            >
              Back to home
            </a>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8A8578] mb-2">
              Building your curriculum
            </p>
            {skeletonTitle ? (
              <h1 className="font-serif text-2xl mb-2">{skeletonTitle}</h1>
            ) : (
              <h1 className="font-serif text-2xl mb-2">Finding structure…</h1>
            )}

            {status.step === "discovery" && status.total && (
              <div className="mt-4 mb-6">
                <div className="flex justify-between text-xs text-[#8A8578] mb-1">
                  <span>Topics</span>
                  <span>
                    {status.current} / {status.total}
                  </span>
                </div>
                <div className="h-1.5 bg-[#E7E3D7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#B8753D] rounded-full transition-all duration-500"
                    style={{
                      width: `${((status.current ?? 0) / status.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2">
              {log.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">
                    {entry.done || i < log.length - 1 ? "✓" : "→"}
                  </span>
                  <p
                    className={`text-sm ${
                      entry.done || i < log.length - 1
                        ? "text-[#8A8578]"
                        : "text-[#1A1A18]"
                    }`}
                  >
                    {entry.message}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#8A8578] mt-8">
              This takes a few minutes — finding real resources across the web
              for each topic. You can leave this tab open.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}