import { motion, AnimatePresence } from "motion/react";
import type { BlobFile } from "@waldrive/shared";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { fileKind, relativeTime } from "@/lib/fileKind";

const EASE = [0.16, 1, 0.3, 1] as const;

export function FileGrid({
  files,
  selectedId,
  onOpen,
}: {
  files: BlobFile[];
  selectedId: string | null;
  onOpen: (file: BlobFile) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence>
        {files.map((file, i) => {
          const { Icon, color, label } = fileKind(file.mimeType, file.name);
          const isImage = file.mimeType.startsWith("image/");
          return (
            <motion.button
              key={file.objectId}
              animate={{ opacity: selectedId === file.objectId ? 0 : 1, y: 0 }}
              aria-label={`Open ${file.name}`}
              className="group text-left outline-none"
              exit={{ opacity: 0, scale: 0.96 }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.025, 0.25), ease: EASE }}
              type="button"
              onClick={() => onOpen(file)}
            >
              <motion.div
                layoutId={`file-${file.objectId}`}
                className="lift flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-1 transition-[background-color,border-color,box-shadow] duration-200 group-focus-visible:ring-2 group-focus-visible:ring-accent-focus/50 hover:border-hairline-strong hover:bg-surface-2 hover:shadow-[var(--lift-2)]"
              >
                <div
                  className="flex h-28 items-center justify-center overflow-hidden"
                  style={{ background: `color-mix(in oklab, ${color} 7%, transparent)` }}
                >
                  {isImage ? (
                    <img
                      alt={file.name}
                      className="size-full object-cover"
                      loading="lazy"
                      src={blobUrl(file.blobId)}
                    />
                  ) : (
                    <span
                      className="flex size-12 items-center justify-center rounded-xl"
                      style={{ background: `color-mix(in oklab, ${color} 16%, transparent)` }}
                    >
                      <Icon aria-hidden className="size-6" style={{ color }} strokeWidth={1.75} />
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 border-t border-hairline px-3 py-2.5">
                  <span className="truncate text-sm text-ink" title={file.name}>
                    {file.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
                    <span
                      className="rounded px-1 py-px font-mono text-[10px] tracking-wide"
                      style={{
                        color,
                        background: `color-mix(in oklab, ${color} 14%, transparent)`,
                      }}
                    >
                      {label}
                    </span>
                    <span>{formatBytes(file.size)}</span>
                    {file.uploadedAtMs > 0 && (
                      <>
                        <span className="text-ink-tertiary">·</span>
                        <span>{relativeTime(file.uploadedAtMs)}</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
