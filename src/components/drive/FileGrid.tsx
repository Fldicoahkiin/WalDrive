"use client";

import { Card } from "@heroui/react";
import { FileText } from "lucide-react";
import { blobUrl, formatBytes } from "@/lib/utils";
import type { BlobFile } from "@waldrive/shared";

export function FileGrid({ files }: { files: BlobFile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => (
        <Card key={file.objectId} variant="secondary" className="overflow-hidden">
          <Card.Content className="flex aspect-video items-center justify-center overflow-hidden p-0">
            {file.mimeType.startsWith("image/") ? (
              // Walrus blobs are external, dynamic-size URLs — native img over next/image on purpose.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={blobUrl(file.blobId)} alt={file.name} className="size-full object-cover" />
            ) : (
              <FileText className="size-10 text-ink-subtle" aria-hidden />
            )}
          </Card.Content>
          <Card.Footer className="flex flex-col items-start gap-0.5">
            <span className="w-full truncate text-sm text-ink" title={file.name}>
              {file.name}
            </span>
            <span className="text-xs text-ink-subtle">{formatBytes(file.size)}</span>
          </Card.Footer>
        </Card>
      ))}
    </div>
  );
}
