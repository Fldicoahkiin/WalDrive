import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ExternalLink, Share2, X } from "lucide-react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function PreviewModal({ file, onClose }: { file: BlobFile | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyLink() {
    if (!file) return;
    await navigator.clipboard.writeText(blobUrl(file.blobId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          style={{ background: "var(--overlay)" }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ scale: 1, y: 0 }}
            className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-hairline bg-surface-1"
            exit={{ scale: 0.97, opacity: 0 }}
            initial={{ scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="truncate text-sm font-medium text-ink" title={file.name}>
                {file.name}
              </span>
              <Button isIconOnly aria-label="Close" size="sm" variant="ghost" onPress={onClose}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {file.mimeType.startsWith("image/") ? (
                <img
                  alt={file.name}
                  className="mx-auto max-h-[55vh] rounded-lg object-contain"
                  src={blobUrl(file.blobId)}
                />
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-ink-subtle">
                  No inline preview — use Open.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-xs text-ink-subtle">
              <span>
                {file.mimeType} · {formatBytes(file.size)}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onPress={copyLink}>
                  {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
                  {copied ? "Copied" : "Share link"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => window.open(blobUrl(file.blobId), "_blank")}
                >
                  <ExternalLink className="size-3.5" />
                  Open
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
