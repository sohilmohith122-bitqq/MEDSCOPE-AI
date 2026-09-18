"use client";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

type Doc = { id: string; fileName: string; docType: string; status: string; failureReason?: string | null };

export default function Documents() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [summary, setSummary] = useState("");
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setErr("");
    try {
      const r = await fetch("/api/documents", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load");
      const j = await r.json();
      setDocs(j.documents);
      setSummary(j.summary);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  }

  useEffect(() => { load(); }, []);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      alert(j.summary ?? JSON.stringify(j.results));
      await load();
    } finally { setUploading(false); }
  }

  return (
    <AppShell role="PATIENT">
      <PageHeader title="Documents" subtitle={summary || "Upload and manage your medical records."} />

      {/* Upload zone */}
      <label
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-clinical-500/60 bg-clinical-500/10"
            : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl text-slate-500">
          ↑
        </div>
        <p className="font-semibold text-slate-300">
          {uploading ? "Uploading…" : "Drag & drop or click to upload"}
        </p>
        <p className="mt-1 text-xs text-slate-600">PDF · JPG · PNG · max 15 MB per file</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface-900/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-clinical-300">
              <span className="h-4 w-4 rounded-full border-2 border-clinical-400 border-t-transparent animate-spin" />
              Uploading…
            </div>
          </div>
        )}
      </label>

      {/* Document list */}
      <div className="mt-5">
        {!docs && !err && <LoadingState label="Loading documents" />}
        {err && <ErrorState message={err} onRetry={load} />}
        {docs && docs.length === 0 && <EmptyState title="No documents yet" hint="Upload your first record above." />}
        <div className="space-y-2">
          {docs?.map((d) => (
            <div key={d.id} className="glass-sm flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-200">{d.fileName}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {d.docType}
                  {d.failureReason ? ` · ${d.failureReason}` : ""}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <StatusBadge status={d.status} />
                <a
                  className="text-xs font-semibold text-clinical-400 hover:text-clinical-300 transition-colors"
                  href={`/api/documents/${d.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open ↗
                </a>
                {d.status === "FAILED" && (
                  <button
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                    onClick={async () => { await fetch(`/api/process?retry=${d.id}`); load(); }}
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
