import { useState } from "react";
import { ChevronDown, ExternalLink, GitBranch, Loader2, RotateCcw } from "lucide-react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { useVersion } from "@/hooks/useVersion";
import { useVersionHistory, type FileVersion } from "@/hooks/useVersionHistory";
import { openExternal } from "@/lib/openExternal";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { relativeTime } from "@/lib/fileKind";

const shortBlob = (id: string) => (id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id);

/** On-chain provenance: every revision is its own verifiable FileRecord, linked
 *  by parent_version_id. Content-addressed — a rollback re-points at an old
 *  blob rather than re-uploading, so byte-identical revisions are detectable. */
export function VersionHistory({ file, onClose }: { file: BlobFile; onClose: () => void }) {
  const { data: history, isLoading } = useVersionHistory(file.parentVersionId);
  const { restoreVersion, status } = useVersion();
  const [open, setOpen] = useState(false);
  const restoring = status === "saving_meta";

  if (!file.parentVersionId) return null;

  const head: FileVersion = {
    objectId: file.objectId,
    blobId: file.blobId,
    version: file.version ?? 1,
    size: file.size,
    uploadedAtMs: file.uploadedAtMs,
    expiryEpoch: file.expiryEpoch,
  };
  const versions = [head, ...(history ?? [])]; // version-descending

  // Content addressing: the earliest version holding a blobId is its origin; a
  // later version with the same blobId is byte-identical (it came from a restore).
  const origin = new Map<string, number>();
  for (const v of [...versions].sort((a, b) => a.version - b.version)) {
    if (!origin.has(v.blobId)) origin.set(v.blobId, v.version);
  }

  async function restore(v: FileVersion) {
    if (await restoreVersion(file.objectId, v)) onClose();
  }

  return (
    <section className="mb-4 rounded-lg border border-hairline bg-canvas/50">
      <button
        className="flex w-full items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-ink-subtle outline-none transition-colors hover:text-ink"
        type="button"
        onClick={() => setOpen((o) => !o)}
      >
        <GitBranch aria-hidden className="size-3.5 text-accent" strokeWidth={1.75} />
        Provenance
        {history && (
          <span className="text-ink-tertiary">
            · {versions.length} revisions on chain
          </span>
        )}
        <ChevronDown
          aria-hidden
          className={`ms-auto size-3.5 text-ink-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-hairline px-3 py-2.5">
          {isLoading && <span className="text-[11px] text-ink-tertiary">Loading chain…</span>}
          <ol className="flex flex-col">
            {versions.map((v, i) => {
              const isHead = i === 0;
              const orig = origin.get(v.blobId) ?? v.version;
              const identical = orig !== v.version;
              const last = i === versions.length - 1;
              return (
                <li key={v.objectId} className="relative flex gap-3 pb-3 last:pb-0">
                  {!last && (
                    <span aria-hidden className="absolute left-[5px] top-3.5 h-full w-px bg-hairline" />
                  )}
                  <span
                    aria-hidden
                    className={`mt-1 size-2.5 shrink-0 rounded-full border ${isHead ? "border-accent bg-accent" : "border-hairline-strong bg-canvas"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-ink">v{v.version}</span>
                      {isHead && (
                        <span className="rounded bg-accent/15 px-1.5 py-px text-[10px] font-medium text-accent">
                          current
                        </span>
                      )}
                      <span className="text-[11px] text-ink-tertiary">
                        {formatBytes(v.size)} · {relativeTime(v.uploadedAtMs)}
                      </span>
                      <span className="ms-auto flex items-center gap-1">
                        <Button
                          isIconOnly
                          aria-label={`Open v${v.version} bytes`}
                          size="sm"
                          variant="ghost"
                          onPress={() => openExternal(blobUrl(v.blobId))}
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                        {!isHead && (
                          <Button isDisabled={restoring} size="sm" variant="ghost" onPress={() => restore(v)}>
                            {restoring ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                            Restore
                          </Button>
                        )}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                      <span className="truncate font-mono text-ink-tertiary" title={v.blobId}>
                        {shortBlob(v.blobId)}
                      </span>
                      <span className="shrink-0 text-ink-tertiary">
                        {identical ? `identical bytes — v${orig}` : "new bytes"}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
