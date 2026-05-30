import { motion } from "motion/react";
import { FileText } from "lucide-react";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import type { BlobFile } from "@waldrive/shared";

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
          type="button"
          onClick={() => onOpen(file)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -2 }}
          className="overflow-hidden rounded-xl border border-hairline bg-surface-1 text-left transition-colors hover:border-hairline-strong"
        >
          <div className="flex aspect-video items-center justify-center overflow-hidden bg-surface-2">
            {file.mimeType.startsWith("image/") ? (
              <img src={blobUrl(file.blobId)} alt={file.name} className="size-full object-cover" />
            ) : (
              <FileText className="size-9 text-ink-tertiary" aria-hidden />
            )}
          </div>
          <div className="flex flex-col gap-0.5 p-2.5">
            <span className="truncate text-sm text-ink" title={file.name}>
              {file.name}
            </span>
            <span className="text-xs text-ink-subtle">{formatBytes(file.size)}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
