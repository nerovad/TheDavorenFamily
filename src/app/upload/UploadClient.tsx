"use client";

import { useState } from "react";

type Status = "idle" | "uploading" | "done" | "error";
type Item = { file: File; status: Status; error?: string };

export function UploadClient() {
  const [items, setItems] = useState<Item[]>([]);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setItems(files.map((file) => ({ file, status: "idle" as const })));
  }

  async function uploadOne(idx: number, file: File) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: "uploading" } : it)));
    try {
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size }),
      });
      if (!presignRes.ok) throw new Error(`presign failed: ${presignRes.status}`);
      const { key, uploadUrl } = (await presignRes.json()) as { key: string; uploadUrl: string };

      const putRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!putRes.ok) throw new Error(`S3 upload failed: ${putRes.status}`);

      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, originalFilename: file.name, mimeType: file.type, sizeBytes: file.size }),
      });
      if (!completeRes.ok) throw new Error(`register failed: ${completeRes.status}`);

      setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: "done" } : it)));
    } catch (err) {
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, status: "error", error: (err as Error).message } : it)),
      );
    }
  }

  async function uploadAll() {
    await Promise.all(items.map((it, i) => (it.status === "idle" ? uploadOne(i, it.file) : Promise.resolve())));
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-sm text-zinc-700 dark:text-zinc-300">Select photos or videos</span>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={onFiles}
          className="mt-2 block w-full text-zinc-900 dark:text-zinc-50 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-zinc-50 dark:file:bg-zinc-100 dark:file:text-zinc-900"
        />
      </label>

      {items.length > 0 && (
        <>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {items.map((it, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">{it.file.name}</p>
                  <p className="text-xs text-zinc-500">{(it.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <span className="ml-4 text-sm">
                  {it.status === "idle" && <span className="text-zinc-500">queued</span>}
                  {it.status === "uploading" && <span className="text-blue-600">uploading…</span>}
                  {it.status === "done" && <span className="text-green-600">done</span>}
                  {it.status === "error" && <span className="text-red-600" title={it.error}>error</span>}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={uploadAll}
            className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-6 py-2.5 font-medium"
          >
            Upload all
          </button>
        </>
      )}
    </div>
  );
}
