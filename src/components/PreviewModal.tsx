import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink, FileUp, Loader2, Pencil, Plus, RotateCcw, Share2, Trash2, X } from "lucide-react";
import { AlertDialog, Input, ListBox, Modal, Select } from "@heroui/react";
import type { BlobFile } from "@waldrive/shared";
import { Button } from "@/components/ui/Button";
import { PreviewBody } from "@/components/PreviewBody";
import { useRename } from "@/hooks/useRename";
import { useDelete } from "@/hooks/useDelete";
import { useTags } from "@/hooks/useTags";
import { useVersion } from "@/hooks/useVersion";
import { useFolders } from "@/hooks/useFolders";
import { useFolder } from "@/hooks/useFolder";
import { blobUrl } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { fileKind } from "@/lib/fileKind";

function DeleteDialog({
  triggerLabel,
  heading,
  body,
  confirmLabel,
  status,
  disabled,
  onConfirm,
}: {
  triggerLabel: string;
  heading: string;
  body: string;
  confirmLabel: string;
  status: "danger" | "warning";
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <Button isIconOnly aria-label={triggerLabel} size="sm" variant="ghost">
        <Trash2 className="size-3.5" />
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="max-w-sm">
            <AlertDialog.Header>
              <AlertDialog.Icon status={status} />
              <AlertDialog.Heading>{heading}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-ink-subtle">{body}</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>
              <Button slot="close" isDisabled={disabled} variant="danger" onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

function TagBar({ file }: { file: BlobFile }) {
  const { addTag, removeTag, busy } = useTags();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  async function submit() {
    if (draft.trim() && (await addTag(file.objectId, draft))) {
      setDraft("");
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-1 flex-wrap items-center gap-1.5">
      {file.tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-md bg-surface-2 py-0.5 pl-2 pr-1 text-xs text-ink-muted"
        >
          {tag}
          <button
            aria-label={`Remove tag ${tag}`}
            className="rounded text-ink-tertiary outline-none transition-colors hover:text-ink"
            type="button"
            onClick={() => removeTag(file.objectId, tag)}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <Input
          autoFocus
          aria-label="New tag"
          className="selectable h-6 w-24 text-xs"
          disabled={busy}
          value={draft}
          variant="secondary"
          onBlur={() => {
            setAdding(false);
            setDraft("");
          }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
            else if (e.key === "Escape") {
              setAdding(false);
              setDraft("");
            }
          }}
        />
      ) : (
        <button
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-ink-tertiary outline-none transition-colors hover:text-ink"
          type="button"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-3" /> Tag
        </button>
      )}
    </div>
  );
}

function MoveBar({ file }: { file: BlobFile }) {
  const { data: folders } = useFolders();
  const { moveToFolder, removeFromFolder, busy } = useFolder();
  if (!folders || folders.length === 0) return null;
  const current = file.folderId ?? "root";

  return (
    <Select
      aria-label="Move to folder"
      className="w-36 shrink-0"
      isDisabled={busy}
      placeholder="Move to…"
      selectedKey={current}
      onSelectionChange={(key) => {
        const k = String(key);
        if (k === current) return;
        if (k === "root") void removeFromFolder(file.objectId);
        else void moveToFolder(file.objectId, k);
      }}
    >
      <Select.Trigger className="h-7 text-xs">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="root" textValue="All Files">
            All Files
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {folders.map((fo) => (
            <ListBox.Item key={fo.objectId} id={fo.objectId} textValue={fo.name}>
              {fo.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

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
