"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

const CHIPS = [
  "What changed recently?",
  "Show medication history",
  "Show conflicts",
  "Show hospitalization events",
  "Show uncertain timeline events",
];

export default function Ask() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<{
    answer: string;
    events: { id: string; title: string }[];
    citations: { document: string; page: number }[];
  } | null>(null);

  async function ask(question: string) {
    if (!question.trim()) return;
    setQ(question);
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      setOut(await r.json());
    } finally { setLoading(false); }
  }

  return (
    <AppShell role="PATIENT">
      <PageHeader
        title="History AI"
        subtitle="Answered only from your records — with citations. Never diagnosis or advice."
        aiDerived
      />

      {/* Suggestion chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => ask(c)}
            className="rounded-full border border-white/8 bg-white/4 px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-white/8 hover:text-slate-200 hover:border-white/15"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(q)}
          placeholder="Ask about your medical history…"
          className="input flex-1"
        />
        <button
          onClick={() => ask(q)}
          disabled={loading || !q.trim()}
          className="btn-primary px-5 disabled:opacity-40"
        >
          {loading ? (
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : "Ask"}
        </button>
      </div>

      {/* Answer */}
      {out && (
        <div className="mt-5 space-y-3 animate-slide-up">
          <div className="glass p-5">
            <p className="section-title mb-3">Answer</p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{out.answer}</p>
          </div>

          {out.citations.length > 0 && (
            <div className="glass-sm p-4">
              <p className="section-title mb-2">Evidence citations</p>
              <ul className="space-y-1.5">
                {out.citations.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-clinical-500" />
                    <span className="font-mono text-slate-500">doc {c.document.slice(0, 8)}…</span>
                    <span>page {c.page}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {out.events.length > 0 && (
            <div className="glass-sm p-4">
              <p className="section-title mb-2">Related events</p>
              <ul className="space-y-1.5">
                {out.events.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    {e.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
