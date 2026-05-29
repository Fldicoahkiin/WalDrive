"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { Share2, Copy, Check } from "lucide-react";
import { useShare } from "@/hooks/useShare";
import type { BlobFile } from "@waldrive/shared";

export function ShareButton({ file }: { file: BlobFile }) {
  const { share, status, objectId, error } = useShare();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    objectId && typeof window !== "undefined" ? `${window.location.origin}/drive/${objectId}` : null;

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2">
        <code className="max-w-[180px] truncate rounded bg-surface-2 px-2 py-1 text-xs text-ink-muted">
          {shareUrl}
        </code>
        <Button variant="secondary" size="sm" onPress={copy} aria-label="Copy share link">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onPress={() => share(file)}
      isDisabled={status === "sharing"}
    >
      <Share2 className="size-4" />
      {status === "sharing" ? "Sharing…" : status === "failed" ? "Retry" : "Share"}
      {status === "failed" && error ? <span className="sr-only">{error}</span> : null}
    </Button>
  );
}
