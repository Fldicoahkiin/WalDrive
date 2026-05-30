import { motion } from "motion/react";
import { FileText } from "lucide-react";
import { Card } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function FileGrid({
  files,
  onOpen,
}: {
  files: BlobFile[];
  onOpen: (file: BlobFile) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file, i) => (
        <motion.button
          key={file.objectId}
          animate={{ opacity: 1, y: 0 }}
          aria-label={`Open ${file.name}`}
          className="rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.3), ease: EASE }}
          type="button"
          whileHover={{ y: -2 }}
          onClick={() => onOpen(file)}
        >
          <Card className="gap-0 overflow-hidden rounded-xl p-0 transition-colors duration-150 hover:border-hairline-strong">
            <div className="flex aspect-video items-center justify-center overflow-hidden bg-surface-2">
              {file.mimeType.startsWith("image/") ? (
                <img
                  alt={file.name}
                  className="size-full object-cover"
                  loading="lazy"
                  src={blobUrl(file.blobId)}
                />
              ) : (
                <FileText aria-hidden className="size-9 text-ink-tertiary" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 p-2.5">
              <span className="truncate text-sm text-ink" title={file.name}>
                {file.name}
              </span>
              <span className="text-xs text-ink-subtle">{formatBytes(file.size)}</span>
            </div>
          </Card>
        </motion.button>
      ))}
    </div>
  );
}
