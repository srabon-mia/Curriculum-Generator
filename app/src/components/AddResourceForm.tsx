"use client";

import { useState } from "react";

const RESOURCE_TYPES = [
  "video",
  "text",
  "textbook",
  "problem_set",
  "reference_tool",
  "practice_exam",
  "other",
] as const;

const LICENSE_OPTIONS = [
  { value: "link_only", label: "Link only (default — use unless verified open)" },
  { value: "cc_open", label: "CC / open licensed (verified)" },
  { value: "unknown_review_needed", label: "Unknown — flag for review" },
] as const;

export function AddResourceForm({
  targetType,
  targetId,
  onAdded,
}: {
  targetType: "node" | "major_understanding";
  targetId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<(typeof RESOURCE_TYPES)[number]>("text");
  const [licenseStatus, setLicenseStatus] =
    useState<(typeof LICENSE_OPTIONS)[number]["value"]>("link_only");
  const [aiNote, setAiNote] = useState("");

  function deriveDomain(rawUrl: string): string | null {
    try {
      return new URL(rawUrl).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const source_domain = deriveDomain(url);

    const body: Record<string, unknown> = {
      url,
      title,
      source_domain,
      resource_type: resourceType,
      license_status: licenseStatus,
      ai_note: aiNote || null,
    };

    if (targetType === "node") {
      body.node_id = targetId;
    } else {
      body.major_understanding_id = targetId;
    }

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add resource");
      }

      setUrl("");
      setTitle("");
      setAiNote("");
      setLicenseStatus("link_only");
      setResourceType("text");
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 rounded-md border border-dashed border-[#D8D4C8] text-[#8A8578] hover:border-[#B8753D] hover:text-[#B8753D] transition"
      >
        + Add resource
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-[#E7E3D7] bg-white p-4 space-y-3"
    >
      <div>
        <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
          URL
        </label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40 focus:border-[#B8753D]"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
          Title
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mr. Ting — Atomic Structure lesson"
          className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40 focus:border-[#B8753D]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
            Type
          </label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as typeof resourceType)}
            className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
            License
          </label>
          <select
            value={licenseStatus}
            onChange={(e) => setLicenseStatus(e.target.value as typeof licenseStatus)}
            className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40"
          >
            {LICENSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-[#8A8578]">
        Embedding is only ever enabled when license is &ldquo;CC / open licensed&rdquo; AND the
        domain has a known reputation score. Default to link-only unless you&rsquo;ve actually
        checked.
      </p>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
          Note (optional)
        </label>
        <input
          type="text"
          value={aiNote}
          onChange={(e) => setAiNote(e.target.value)}
          placeholder="Why this resource, why here"
          className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40 focus:border-[#B8753D]"
        />
      </div>

      {error && <p className="text-sm text-[#B8453D]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm px-4 py-2 rounded-md bg-[#1A1A18] text-white hover:bg-[#3D3A30] transition disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add to review queue"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm px-4 py-2 rounded-md text-[#8A8578] hover:text-[#1A1A18] transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
