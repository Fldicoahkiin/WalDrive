import { useEffect, useState } from "react";
import { Check, ExternalLink, Loader2, Pencil, Share2, Trash2 } from "lucide-react";
import { AlertDialog, Input, Modal } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { PreviewBody } from "@/components/PreviewBody";
import { useRename } from "@/hooks/useRename";
import { useDelete } from "@/hooks/useDelete";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { fileKind } from "@/lib/fileKind";

export function PreviewModal({ file, onClose }: { file: BlobFile | null; onClose: () => void }) {
  // Retain the last file through the close animation so content doesn't vanish.
  const [shown, setShown] = useState<BlobFile | null>(file);
  useEffect(() => {
    if (file) setShown(file);
  }, [file]);
  const f = file ?? shown;

  const [name, setName] = useState(f?.name ?? "");
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { rename, status: renameStatus, error: renameError } = useRename();
  const { remove, status: deleteStatus, error: deleteError } = useDelete();
  const editing = draft !== null;
  const saving = renameStatus === "saving";
  const deleting = deleteStatus === "deleting";

  useEffect(() => {
    setName(f?.name ?? "");
    setDraft(null);
  }, [f?.objectId]);

  const kind = f ? fileKind(f.mimeType, f.name) : null;

  async function submitRename() {
    if (!f || draft === null) return;
    const next = draft.trim();
    if (!next || next === name) {
      setDraft(null);
      return;
    }
    if (await rename(f.objectId, next)) {
      setName(next);
      setDraft(null);
    }
  }

  async function copyLink() {
    if (!f) return;
    await navigator.clipboard.writeText(blobUrl(f.blobId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function confirmDelete() {
    if (f && (await remove(f.objectId))) onClose();
  }

  return (
    <Modal isOpen={!!file} onOpenChange={(v) => !v && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full max-w-2xl">
            {f && kind && (
              <>
                <Modal.Header className="flex items-center gap-2">
                  <kind.Icon
                    aria-hidden
                    className="size-4 shrink-0"
                    style={{ color: kind.color }}
                    strokeWidth={1.75}
                  />
                  {editing ? (
                    <Input
                      autoFocus
                      aria-label="New file name"
                      className="selectable min-w-0 flex-1 text-sm"
                      disabled={saving}
                      value={draft}
                      variant="secondary"
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void submitRename();
                        else if (e.key === "Escape") setDraft(null);
                      }}
                    />
                  ) : (
                    <Modal.Heading className="min-w-0 flex-1 truncate" title={name}>
                      {name}
                    </Modal.Heading>
                  )}
                  <Button
                    isIconOnly
                    aria-label={editing ? "Save name" : "Rename"}
                    isDisabled={saving}
                    size="sm"
                    variant="ghost"
                    onPress={() => (editing ? submitRename() : setDraft(name))}
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : editing ? (
                      <Check className="size-4" />
                    ) : (
                      <Pencil className="size-4" />
                    )}
                  </Button>
                  <Modal.CloseTrigger />
                </Modal.Header>

                <Modal.Body className="max-h-[62vh] overflow-auto">
                  <PreviewBody file={f} kind={kind} />
                </Modal.Body>

                <Modal.Footer className="items-center justify-between gap-3 text-xs text-ink-subtle">
                  <span
                    className={renameError ? "min-w-0 truncate text-danger" : "min-w-0 truncate"}
                    title={renameError ?? undefined}
                  >
                    {renameError ?? `${f.mimeType} · ${formatBytes(f.size)}`}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <AlertDialog>
                      <Button isIconOnly aria-label="Delete" size="sm" variant="ghost">
                        <Trash2 className="size-3.5" />
                      </Button>
                      <AlertDialog.Backdrop>
                        <AlertDialog.Container>
                          <AlertDialog.Dialog className="max-w-sm">
                            <AlertDialog.Header>
                              <AlertDialog.Icon status="danger" />
                              <AlertDialog.Heading>Delete this file?</AlertDialog.Heading>
                            </AlertDialog.Header>
                            <AlertDialog.Body>
                              <p className={deleteError ? "text-sm text-danger" : "text-sm text-ink-subtle"}>
                                {deleteError ??
                                  "This removes the file's on-chain record. It can't be undone."}
                              </p>
                            </AlertDialog.Body>
                            <AlertDialog.Footer>
                              <Button slot="close" variant="ghost">
                                Cancel
                              </Button>
                              <Button isDisabled={deleting} variant="danger" onPress={confirmDelete}>
                                {deleting ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3.5" />
                                )}
                                Delete
                              </Button>
                            </AlertDialog.Footer>
                          </AlertDialog.Dialog>
                        </AlertDialog.Container>
                      </AlertDialog.Backdrop>
                    </AlertDialog>
                    <Button size="sm" variant="secondary" onPress={copyLink}>
                      {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
                      {copied ? "Copied" : "Share link"}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => window.open(blobUrl(f.blobId), "_blank")}
                    >
                      <ExternalLink className="size-3.5" />
                      Open
                    </Button>
                  </div>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
