import { motion, AnimatePresence } from "motion/react";
import type { BlobFile } from "@waldrive/shared";
import { formatBytes } from "@/lib/utils";
import { fileKind, relativeTime } from "@/lib/fileKind";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Placeholder rows mirroring the list geometry while the file list loads. */
export function FileListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-hairline px-3 py-2.5 last:border-b-0"
        >
          <div className="size-8 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-3.5 flex-1 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export function FileList({
  files,
  selectedId,
  onOpen,
}: {
  files: BlobFile[];
  selectedId: string | null;
  onOpen: (file: BlobFile) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1">
      <AnimatePresence>
        {files.map((file, i) => {
          const { Icon, color, label } = fileKind(file.mimeType, file.name);
          return (
            <motion.button
              key={file.objectId}
              layout
              animate={{ opacity: selectedId === file.objectId ? 0 : 1, y: 0 }}
              aria-label={`Open ${file.name}`}
              className="group flex items-center gap-3 border-b border-hairline px-3 py-2.5 text-left outline-none transition-colors last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-focus/50 focus-visible:ring-inset"
              exit={{ opacity: 0, scale: 0.98 }}
              initial={{ opacity: 0, y: 6 }}
              transition={{
                duration: 0.2,
                delay: Math.min(i * 0.02, 0.2),
                ease: EASE,
                layout: { duration: 0.3, ease: EASE },
              }}
              type="button"
              onClick={() => onOpen(file)}
            >
              <motion.span
                layoutId={`file-${file.objectId}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `color-mix(in oklab, ${color} 14%, transparent)` }}
              >
                <Icon aria-hidden className="size-4" style={{ color }} strokeWidth={1.75} />
              </motion.span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink" title={file.name}>
                {file.name}
              </span>
              <span
                className="hidden shrink-0 rounded px-1 py-px font-mono text-[10px] tracking-wide sm:block"
                style={{ color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}
              >
                {label}
              </span>
              <span className="w-16 shrink-0 text-right text-xs text-ink-subtle">
                {formatBytes(file.size)}
              </span>
              {file.uploadedAtMs > 0 && (
                <span className="hidden w-20 shrink-0 text-right text-xs text-ink-tertiary md:block">
                  {relativeTime(file.uploadedAtMs)}
                </span>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
