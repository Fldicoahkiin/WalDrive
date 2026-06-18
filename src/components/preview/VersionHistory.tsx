import { useState } from "react";
import { ChevronDown, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { useVersion } from "@/hooks/useVersion";
import { useVersionHistory, type FileVersion } from "@/hooks/useVersionHistory";
import { openExternal } from "@/lib/openExternal";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { relativeTime } from "@/lib/fileKind";

/** Collapsible on-chain version chain with one-tx rollback. */
export function VersionHistory({ file, onClose }: { file: BlobFile; onClose: () => void }) {
  const { data: history, isLoading } = useVersionHistory(file.parentVersionId);
  const { restoreVersion, status } = useVersion();
  const [open, setOpen] = useState(false);
  const restoring = status === "saving_meta";

  if (!file.parentVersionId) return null;

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
        <RotateCcw aria-hidden className="size-3.5 text-accent" strokeWidth={1.75} />
        History
        {history && <span className="text-ink-tertiary">· {history.length} earlier {history.length === 1 ? "version" : "versions"}</span>}
        <ChevronDown aria-hidden className={`ms-auto size-3.5 text-ink-tertiary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 border-t border-hairline px-2 py-1.5">
          {isLoading && <span className="px-1 py-1 text-[11px] text-ink-tertiary">Loading history…</span>}
          {history?.map((v) => (
            <div key={v.objectId} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-2">
              <span className="font-mono text-[11px] text-ink">v{v.version}</span>
              <span className="text-[11px] text-ink-tertiary">{formatBytes(v.size)} · {relativeTime(v.uploadedAtMs)}</span>
              <span className="ms-auto flex items-center gap-1">
                <Button isIconOnly aria-label={`Open v${v.version} raw`} size="sm" variant="ghost" onPress={() => openExternal(blobUrl(v.blobId))}>
                  <ExternalLink className="size-3" />
                </Button>
                <Button isDisabled={restoring} size="sm" variant="ghost" onPress={() => restore(v)}>
                  {restoring ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                  Restore
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
