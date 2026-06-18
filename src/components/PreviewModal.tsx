import { openExternal } from "@/lib/openExternal";
import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink, FileUp, Loader2, Pencil, RotateCcw, Share2 } from "lucide-react";
import { Input, Modal } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { PreviewBody } from "@/components/PreviewBody";
import { DeleteDialog } from "@/components/preview/DeleteDialog";
import { TagBar } from "@/components/preview/TagBar";
import { MoveBar } from "@/components/preview/MoveBar";
import { VersionHistory } from "@/components/preview/VersionHistory";
import { VerifiableStorage } from "@/components/preview/VerifiableStorage";
import { useRename } from "@/hooks/useRename";
import { useDelete } from "@/hooks/useDelete";
import { useVersion } from "@/hooks/useVersion";
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
  const { trash, restore, purge, status: deleteStatus, error: deleteError } = useDelete();
  const { uploadVersion, status: versionStatus } = useVersion();
  const versionInputRef = useRef<HTMLInputElement>(null);
  const editing = draft !== null;
  const saving = renameStatus === "saving";
  const deleting = deleteStatus === "deleting";
  const versioning = versionStatus === "uploading" || versionStatus === "saving_meta";

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

  async function act(fn: (id: string) => Promise<boolean>) {
    if (f && (await fn(f.objectId))) onClose();
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

                <div className="flex items-start justify-between gap-2 px-4 pb-1">
                  <TagBar file={f} />
                  {!f.isDeleted && <MoveBar file={f} />}
                </div>

                <Modal.Body className="max-h-[62vh] overflow-auto">
                  <VerifiableStorage file={f} />
                  <VersionHistory file={f} onClose={onClose} />
                  <PreviewBody file={f} kind={kind} />
                </Modal.Body>

                <Modal.Footer className="items-center justify-between gap-3 text-xs text-ink-subtle">
                  <span
                    className={renameError ? "min-w-0 truncate text-danger" : "min-w-0 truncate"}
                    title={renameError ?? undefined}
                  >
                    {renameError ??
                      `${f.mimeType} · ${formatBytes(f.size)}${f.version && f.version > 1 ? ` · v${f.version}` : ""}`}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {f.isDeleted ? (
                      <>
                        <Button
                          isDisabled={deleting}
                          size="sm"
                          variant="secondary"
                          onPress={() => act(restore)}
                        >
                          {deleting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="size-3.5" />
                          )}
                          Restore
                        </Button>
                        <DeleteDialog
                          body={deleteError ?? "This destroys the on-chain record for good."}
                          confirmLabel="Delete"
                          disabled={deleting}
                          heading="Delete permanently?"
                          status="danger"
                          triggerLabel="Delete permanently"
                          onConfirm={() => act(purge)}
                        />
                      </>
                    ) : (
                      <>
                        <input
                          ref={versionInputRef}
                          className="hidden"
                          type="file"
                          onChange={(e) => {
                            const next = e.target.files?.[0];
                            if (next) void uploadVersion(f.objectId, next);
                            e.currentTarget.value = "";
                          }}
                        />
                        <Button
                          isIconOnly
                          aria-label="Upload new version"
                          isDisabled={versioning}
                          size="sm"
                          variant="ghost"
                          onPress={() => versionInputRef.current?.click()}
                        >
                          {versioning ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <FileUp className="size-3.5" />
                          )}
                        </Button>
                        <DeleteDialog
                          body={deleteError ?? "You can restore it from Trash later."}
                          confirmLabel="Move"
                          disabled={deleting}
                          heading="Move to trash?"
                          status="warning"
                          triggerLabel="Move to trash"
                          onConfirm={() => act(trash)}
                        />
                        <Button size="sm" variant="secondary" onPress={copyLink}>
                          {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
                          {copied ? "Copied" : "Share link"}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => openExternal(blobUrl(f.blobId))}
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
