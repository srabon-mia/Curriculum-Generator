"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LEARNING_GOALS = [
  "Pass an exam (Regents, AP, IB, SAT, etc.)",
  "Understand the subject deeply",
  "Prepare for college coursework",
  "Personal interest / curiosity",
  "Professional or career preparation",
];

const TIME_AVAILABLE = [
  "Less than 1 week",
  "1-2 weeks",
  "1 month",
  "A full semester",
  "No time pressure",
];

const GRADE_LEVELS = [
  "Middle school (6-8)",
  "High school (9-12)",
  "AP / IB level",
  "Introductory college",
  "Intermediate college",
];

const DIFFICULTIES = [
  "Standard",
  "Honors / accelerated",
  "Advanced / rigorous",
];

export function GenerateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("High school (9-12)");
  const [difficulty, setDifficulty] = useState("Standard");
  const [existingKnowledge, setExistingKnowledge] = useState("");
  const [learningGoal, setLearningGoal] = useState("Understand the subject deeply");
  const [timeAvailable, setTimeAvailable] = useState("1 month");
  const [addedContext, setAddedContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            topic: topic.trim(),
            grade_level: gradeLevel,
            difficulty,
            existing_knowledge: existingKnowledge,
            learning_goal: learningGoal,
            time_available: timeAvailable,
            added_context: addedContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      if (data.cached) {
        // Already exists — go straight to it
        router.push(`/curriculum/${data.curriculum_id}`);
      } else {
        // New generation — go to progress page
        router.push(`/generate/${data.curriculum_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
          What do you want to learn?
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. AP Chemistry, Calculus AB, World History"
          className="w-full rounded-md border border-[#D8D4C8] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40 focus:border-[#B8753D]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
            Grade level
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40"
          >
            {GRADE_LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
          Existing knowledge (optional)
        </label>
        <input
          type="text"
          value={existingKnowledge}
          onChange={(e) => setExistingKnowledge(e.target.value)}
          placeholder="e.g. completed Algebra 2, familiar with basic biology"
          className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40 focus:border-[#B8753D]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
          Learning goal
          </label>
          <select
          value={learningGoal}
          onChange={(e) => setLearningGoal(e.target.value)}
          className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40"
          >
          {LEARNING_GOALS.map((g) => (
              <option key={g}>{g}</option>
          ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
          Time available
          </label>
          <select
          value={timeAvailable}
          onChange={(e) => setTimeAvailable(e.target.value)}
          className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40"
          >
          {TIME_AVAILABLE.map((t) => (
              <option key={t}>{t}</option>
          ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[#8A8578] mb-1">
            Anything else? (optional)
        </label>
        <textarea
            value={addedContext}
            onChange={(e) => setAddedContext(e.target.value)}
            placeholder="e.g. I'm preparing for the MCAT, focus on the math-heavy parts, I already know basic algebra…"
            rows={2}
            className="w-full rounded-md border border-[#D8D4C8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8753D]/40 focus:border-[#B8753D] resize-none"
        />
      </div>

      {error && <p className="text-sm text-[#B8453D]">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || !topic.trim()}
        className="w-full py-3 rounded-md bg-[#1A1A18] text-white text-sm hover:bg-[#3D3A30] transition disabled:opacity-50"
      >
        {loading ? "Starting…" : "Build my curriculum →"}
      </button>

      <p className="text-xs text-[#8A8578] text-center">
        Takes 3-5 minutes · No account required ·{" "}
        <Link href="/curriculum" className="underline hover:text-[#1A1A18]">
          Browse existing curricula
        </Link>
      </p>
    </div>
  );
}