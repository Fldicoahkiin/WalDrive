import { openExternal } from "@/lib/openExternal";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, FileUp, Loader2, Pencil, Plus, RotateCcw, Share2, ShieldCheck, Trash2, X } from "lucide-react";
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
import { useSettings } from "@/stores/settingsStore";
import { getWalrusEpoch, EPOCH_DAYS } from "@/lib/walrusSdk";
import { blobUrl, explorerUrl } from "@/lib/constants";
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
  const { addTag, removeTag, busy, error } = useTags();
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
      {error && <span className="w-full truncate text-[11px] text-danger" title={error}>{error}</span>}
    </div>
  );
}

function MoveBar({ file }: { file: BlobFile }) {
  const { data: folders } = useFolders();
  const { moveToFolder, removeFromFolder, busy, error } = useFolder();
  if (!folders || folders.length === 0) return null;
  const current = file.folderId ?? "root";

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
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
    {error && <span className="max-w-44 truncate text-[11px] text-danger" title={error}>{error}</span>}
    </div>
  );
}

type VerifyState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "ok"; bytes: number; hashHex: string }
  | { phase: "fail" };

function VerifiableStorage({ file }: { file: BlobFile }) {
  const network = useSettings((s) => s.network);
  const [verify, setVerify] = useState<VerifyState>({ phase: "idle" });
  const [copiedId, setCopiedId] = useState(false);
  const { data: walrusEpoch } = useQuery({
    queryKey: ["walrus-epoch", network],
    enabled: network === "testnet" || network === "mainnet",
    staleTime: 5 * 60_000,
    queryFn: () => getWalrusEpoch(network),
  });
  // Records written before the fix stored the duration (e.g. 3), not the epoch.
  const expiryIsReal = walrusEpoch != null && file.expiryEpoch > walrusEpoch / 2;
  const epochsLeft = walrusEpoch != null && expiryIsReal ? file.expiryEpoch - walrusEpoch : null;
  const daysPerEpoch = network === "mainnet" ? EPOCH_DAYS.mainnet : EPOCH_DAYS.testnet;
  const expiryLine = !expiryIsReal
    ? `Walrus expiry: epoch ${file.expiryEpoch}`
    : epochsLeft != null && epochsLeft <= 0
      ? `Walrus expiry: epoch ${file.expiryEpoch} — expired`
      : `Walrus expiry: epoch ${file.expiryEpoch}${epochsLeft != null ? ` · ≈${epochsLeft * daysPerEpoch}d left` : ""}`;

  useEffect(() => {
    setVerify({ phase: "idle" });
    setCopiedId(false);
  }, [file.objectId]);

  async function copyId() {
    await navigator.clipboard.writeText(file.blobId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  }

  async function runVerify() {
    setVerify({ phase: "checking" });
    try {
      const res = await fetch(blobUrl(file.blobId));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buf);
      const hashHex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setVerify({ phase: "ok", bytes: buf.byteLength, hashHex });
    } catch {
      setVerify({ phase: "fail" });
    }
  }

  const checking = verify.phase === "checking";

  return (
    <section className="mb-4 rounded-lg border border-hairline bg-canvas/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-subtle">
        <ShieldCheck aria-hidden className="size-3.5 text-accent" strokeWidth={1.75} />
        Verifiable storage
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-ink-tertiary">Walrus content ID (content-addressed)</div>
            <div className="truncate font-mono text-xs text-ink" title={file.blobId}>
              {file.blobId}
            </div>
          </div>
          <Button isIconOnly aria-label="Copy content ID" size="sm" variant="ghost" onPress={copyId}>
            {copiedId ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button isDisabled={checking} size="sm" variant="secondary" onPress={runVerify}>
            {checking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            Verify
          </Button>
          <Button size="sm" variant="ghost" onPress={() => openExternal(blobUrl(file.blobId))}>
            <ExternalLink className="size-3.5" />
            Open raw
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => openExternal(explorerUrl("object", file.objectId, network))}
          >
            <ExternalLink className="size-3.5" />
            View on Suiscan
          </Button>
        </div>
        {verify.phase === "ok" && (
          <div className="font-mono text-[11px] text-success">
            ✓ Retrieved {verify.bytes} B from Walrus · SHA-256 {verify.hashHex.slice(0, 12)}…
          </div>
        )}
        {verify.phase === "fail" && (
          <div className="text-[11px] text-danger">✗ couldn't retrieve from aggregator</div>
        )}
        <div className="text-[11px] text-ink-tertiary">{expiryLine}</div>
      </div>
    </section>
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
                  <VerifiableStorage file={f} />
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
