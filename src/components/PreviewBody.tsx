import { useQuery } from "@tanstack/react-query";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BlobFile } from "@waldrive/shared";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { previewMode, type FileKind } from "@/lib/fileKind";

const TEXT_CAP = 512 * 1024; // don't pull huge blobs into a <pre>
const TEXTUAL = new Set(["text", "markdown", "json"]);

function FallbackTile({ kind, note }: { kind: FileKind; note: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3 text-sm text-ink-subtle">
      <span
        className="flex size-14 items-center justify-center rounded-2xl"
        style={{ background: `color-mix(in oklab, ${kind.color} 14%, transparent)` }}
      >
        <kind.Icon aria-hidden className="size-7" style={{ color: kind.color }} strokeWidth={1.5} />
      </span>
      {note}
    </div>
  );
}

/** Inline preview body: image / pdf / video / audio / markdown / json / text. */
export function PreviewBody({ file, kind }: { file: BlobFile; kind: FileKind }) {
  const mode = previewMode(file.mimeType, file.name);
  const isTextual = TEXTUAL.has(mode);
  const textTooLarge = isTextual && file.size > TEXT_CAP;
  const { data: text, isLoading: textLoading } = useQuery({
    queryKey: ["blob-text", file.blobId],
    enabled: isTextual && !textTooLarge,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(blobUrl(file.blobId));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    },
  });

  if (mode === "image") {
    return (
      <img
        alt={file.name}
        className="mx-auto max-h-[60vh] rounded-lg object-contain"
        src={blobUrl(file.blobId)}
      />
    );
  }
  if (mode === "pdf") {
    return (
      <iframe
        className="h-[62vh] w-full rounded-lg border border-hairline bg-canvas"
        src={blobUrl(file.blobId)}
        title={file.name}
      />
    );
  }
  if (mode === "video") {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption -- arbitrary user blobs have no captions
      <video
        controls
        className="mx-auto max-h-[60vh] w-full rounded-lg border border-hairline bg-canvas"
        src={blobUrl(file.blobId)}
      />
    );
  }
  if (mode === "audio") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <span
          className="flex size-14 items-center justify-center rounded-2xl"
          style={{ background: `color-mix(in oklab, ${kind.color} 14%, transparent)` }}
        >
          <kind.Icon aria-hidden className="size-7" style={{ color: kind.color }} strokeWidth={1.5} />
        </span>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls className="w-full max-w-md" src={blobUrl(file.blobId)} />
      </div>
    );
  }

  if (isTextual && !textTooLarge) {
    if (textLoading) {
      return <p className="py-16 text-center text-sm text-ink-subtle">Loading preview…</p>;
    }
    if (text == null) {
      return <FallbackTile kind={kind} note="Couldn't load preview. Open to view." />;
    }
    if (mode === "markdown") {
      return (
        <div className="selectable prose-preview max-h-[62vh] overflow-auto rounded-lg border border-hairline bg-canvas px-5 py-4 text-sm leading-relaxed text-ink-muted">
          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
        </div>
      );
    }
    const body =
      mode === "json"
        ? (() => {
            try {
              return JSON.stringify(JSON.parse(text), null, 2);
            } catch {
              return text; // not valid JSON — show as-is
            }
          })()
        : text;
    return (
      <pre className="selectable max-h-[62vh] overflow-auto rounded-lg border border-hairline bg-canvas p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-ink-muted">
        {body}
      </pre>
    );
  }
  return (
    <FallbackTile
      kind={kind}
      note={
        textTooLarge
          ? `Too large to preview inline (${formatBytes(file.size)}). Open to view.`
          : "No inline preview. Open to view."
      }
    />
  );
}
