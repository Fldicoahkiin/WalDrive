import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ExternalLink, Share2, X } from "lucide-react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { fileKind } from "@/lib/fileKind";

const EASE = [0.16, 1, 0.3, 1] as const;

export function PreviewModal({ file, onClose }: { file: BlobFile | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!file) return;
    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => restoreTo?.focus();
  }, [file]);

  async function copyLink() {
    if (!file) return;
    await navigator.clipboard.writeText(blobUrl(file.blobId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const kind = file ? fileKind(file.mimeType, file.name) : null;
  const isImage = file?.mimeType.startsWith("image/") ?? false;

  return (
    <AnimatePresence>
      {file && kind && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          style={{ background: "color-mix(in oklab, var(--background) 72%, transparent)" }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            aria-label={file.name}
            aria-modal="true"
            layoutId={`file-${file.objectId}`}
            className="lift-2 flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-hairline-strong bg-surface-1 outline-none"
            role="dialog"
            tabIndex={-1}
            transition={{ layout: { duration: 0.32, ease: EASE } }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ opacity: 1 }}
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.12 }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <kind.Icon
                    aria-hidden
                    className="size-4 shrink-0"
                    style={{ color: kind.color }}
                    strokeWidth={1.75}
                  />
                  <span className="truncate text-sm font-medium text-ink" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <Button isIconOnly aria-label="Close" size="sm" variant="ghost" onPress={onClose}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {isImage ? (
                  <img
                    alt={file.name}
                    className="mx-auto max-h-[55vh] rounded-lg object-contain"
                    src={blobUrl(file.blobId)}
                  />
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center gap-3 text-sm text-ink-subtle">
                    <span
                      className="flex size-14 items-center justify-center rounded-2xl"
                      style={{ background: `color-mix(in oklab, ${kind.color} 14%, transparent)` }}
                    >
                      <kind.Icon
                        aria-hidden
                        className="size-7"
                        style={{ color: kind.color }}
                        strokeWidth={1.5}
                      />
                    </span>
                    No inline preview — open to view.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-xs text-ink-subtle">
                <span className="truncate">
                  {file.mimeType} · {formatBytes(file.size)}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="secondary" onPress={copyLink}>
                    {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
                    {copied ? "Copied" : "Share link"}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onPress={() => window.open(blobUrl(file.blobId), "_blank")}
                  >
                    <ExternalLink className="size-3.5" />
                    Open
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
