"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { X, ExternalLink } from "lucide-react";
import { blobUrl, formatBytes } from "@/lib/utils";
import { ShareButton } from "@/components/drive/ShareButton";
import type { BlobFile } from "@waldrive/shared";

export function FileDetailPanel({ file, onClose }: { file: BlobFile; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const url = blobUrl(file.blobId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-hairline bg-surface-1"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={file.name}
      >
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <span className="truncate text-sm font-medium text-ink">{file.name}</span>
          <button onClick={onClose} aria-label="Close" className="text-ink-subtle hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <Preview file={file} url={url} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-xs text-ink-subtle">
          <span>
            {file.mimeType} · {formatBytes(file.size)}
          </span>
          <div className="flex items-center gap-2">
            <ShareButton file={file} />
            <Button variant="secondary" size="sm" onPress={() => window.open(url, "_blank")}>
              <ExternalLink className="size-4" />
              Open
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Preview({ file, url }: { file: BlobFile; url: string }) {
  const { mimeType } = file;
  if (mimeType.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={file.name} className="mx-auto max-h-[60vh] object-contain" />;
  }
  if (mimeType === "application/pdf") {
    return <iframe src={url} title={file.name} className="h-[60vh] w-full rounded-lg" />;
  }
  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("xml")
  ) {
    return <TextPreview url={url} />;
  }
  return <p className="py-8 text-center text-sm text-ink-subtle">No inline preview — use Open.</p>;
}

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => r.text())
      .then((t) => {
        if (alive) setText(t.slice(0, 20_000));
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [url]);

  if (failed) return <p className="text-sm text-red-400">Failed to load preview.</p>;
  if (text === null) return <p className="text-sm text-ink-subtle">Loading…</p>;
  return <pre className="whitespace-pre-wrap break-words text-xs text-ink-muted">{text}</pre>;
}
