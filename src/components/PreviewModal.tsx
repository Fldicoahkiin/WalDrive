import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ExternalLink, Loader2, Pencil, Share2, Trash2, X } from "lucide-react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { PreviewBody } from "@/components/PreviewBody";
import { useRename } from "@/hooks/useRename";
import { useDelete } from "@/hooks/useDelete";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { fileKind } from "@/lib/fileKind";

const EASE = [0.16, 1, 0.3, 1] as const;

export function PreviewModal({ file, onClose }: { file: BlobFile | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(file?.name ?? "");
  const [draft, setDraft] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { rename, status: renameStatus, error: renameError } = useRename();
  const { remove, status: deleteStatus, error: deleteError } = useDelete();
  const editing = draft !== null;
  const saving = renameStatus === "saving";
  const deleting = deleteStatus === "deleting";

  useEffect(() => {
    setName(file?.name ?? "");
    setDraft(null);
    setConfirmingDelete(false);
  }, [file]);

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

  async function submitRename() {
    if (!file || draft === null) return;
    const next = draft.trim();
    if (!next || next === name) {
      setDraft(null);
      return;
    }
    const ok = await rename(file.objectId, next);
    if (ok) {
      setName(next);
      setDraft(null);
    }
  }

  async function copyLink() {
    if (!file) return;
    await navigator.clipboard.writeText(blobUrl(file.blobId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function confirmDelete() {
    if (!file) return;
    const ok = await remove(file.objectId);
    if (ok) {
      setConfirmingDelete(false);
      onClose();
    }
  }

  const kind = file ? fileKind(file.mimeType, file.name) : null;

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
            aria-label={name}
            aria-modal="true"
            layoutId={`file-${file.objectId}`}
            className="lift-2 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-hairline-strong bg-surface-1 outline-none"
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
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <kind.Icon
                    aria-hidden
                    className="size-4 shrink-0"
                    style={{ color: kind.color }}
                    strokeWidth={1.75}
                  />
                  {editing ? (
                    <input
                      autoFocus
                      aria-label="New file name"
                      className="selectable min-w-0 flex-1 rounded border border-hairline-strong bg-canvas px-2 py-1 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent-focus/50"
                      disabled={saving}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") void submitRename();
                        else if (e.key === "Escape") setDraft(null);
                      }}
                    />
                  ) : (
                    <span className="truncate text-sm font-medium text-ink" title={name}>
                      {name}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {editing ? (
                    <Button
                      isIconOnly
                      aria-label="Save name"
                      isDisabled={saving}
                      size="sm"
                      variant="ghost"
                      onPress={submitRename}
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      isIconOnly
                      aria-label="Rename"
                      size="sm"
                      variant="ghost"
                      onPress={() => setDraft(name)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  )}
                  <Button isIconOnly aria-label="Close" size="sm" variant="ghost" onPress={onClose}>
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                <PreviewBody file={file} kind={kind} />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-xs text-ink-subtle">
                {confirmingDelete ? (
                  <>
                    <span
                      className={deleteError ? "truncate text-danger" : "truncate"}
                      title={deleteError ?? undefined}
                    >
                      {deleteError ?? "Delete this file's on-chain record? This can't be undone."}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        isDisabled={deleting}
                        size="sm"
                        variant="ghost"
                        onPress={() => setConfirmingDelete(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        isDisabled={deleting}
                        size="sm"
                        variant="danger"
                        onPress={confirmDelete}
                      >
                        {deleting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span
                      className={renameError ? "truncate text-danger" : "truncate"}
                      title={renameError ?? undefined}
                    >
                      {renameError ?? `${file.mimeType} · ${formatBytes(file.size)}`}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        isIconOnly
                        aria-label="Delete"
                        size="sm"
                        variant="ghost"
                        onPress={() => setConfirmingDelete(true)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
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
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
