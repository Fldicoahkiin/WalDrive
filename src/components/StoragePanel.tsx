import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Loader2, Trash2 } from "lucide-react";
import { AlertDialog } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { useFiles } from "@/hooks/useFiles";
import { listOwnedBlobs, extendOwnedBlob, deleteOwnedBlob, type OwnedBlob } from "@/lib/walrusSdk";
import { formatBytes, shortenAddress } from "@/lib/utils";

/**
 * The wallet's Walrus Blob objects — the on-chain storage receipts behind the
 * files. Owning them is what makes storage renewable (extend) and reclaimable
 * (delete); this panel is where that actually happens.
 */
export function StoragePanel() {
  const address = useWallet((s) => s.address);
  const keypair = useWallet((s) => s.keypair);
  const network = useSettings((s) => s.network);
  const epochs = useSettings((s) => s.epochs);
  const queryClient = useQueryClient();
  const { data: files } = useFiles();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: blobs, isLoading } = useQuery({
    queryKey: ["owned-blobs", address, network],
    enabled: Boolean(address) && (network === "testnet" || network === "mainnet"),
    staleTime: 60_000,
    queryFn: () => listOwnedBlobs(address!, network),
  });

  const nameFor = (blobId: string) => files?.find((f) => f.blobId === blobId)?.name ?? null;

  async function run(blob: OwnedBlob, action: "extend" | "delete") {
    if (!keypair) return;
    setBusyId(blob.objectId);
    setError(null);
    try {
      if (action === "extend") await extendOwnedBlob(blob.objectId, epochs, { keypair, network });
      else await deleteOwnedBlob(blob.objectId, { keypair, network });
      await queryClient.invalidateQueries({ queryKey: ["owned-blobs"] });
    } catch (e) {
      const m = e instanceof Error ? e.message : "Action failed.";
      setError(/wal\b|balance|coin/i.test(m) ? "Needs WAL in this wallet — swap a little first." : m);
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <p className="text-xs text-ink-tertiary">Loading storage objects…</p>;
  if (!blobs || blobs.length === 0) {
    return <p className="text-xs text-ink-tertiary">No Walrus storage objects in this wallet yet.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {blobs.map((b) => {
        const name = nameFor(b.blobId);
        const busy = busyId === b.objectId;
        return (
          <div
            key={b.objectId}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-2"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-ink">
                {name ?? <span className="font-mono">{shortenAddress(b.blobId, 6)}</span>}
                {!name && <span className="ml-1.5 text-[11px] text-ink-tertiary">(unreferenced)</span>}
              </div>
              <div className="text-[11px] text-ink-tertiary">
                {formatBytes(b.size)} · expires epoch {b.endEpoch}
                {!b.deletable && " · permanent"}
              </div>
            </div>
            <Button
              isDisabled={busy}
              size="sm"
              variant="ghost"
              onPress={() => run(b, "extend")}
            >
              {busy ? <Loader2 className="size-3 animate-spin" /> : <CalendarPlus className="size-3" />}
              +{epochs} epochs
            </Button>
            {b.deletable && (
              <AlertDialog>
                <Button isIconOnly aria-label="Delete blob" isDisabled={busy} size="sm" variant="ghost">
                  <Trash2 className="size-3.5" />
                </Button>
                <AlertDialog.Backdrop>
                  <AlertDialog.Container>
                    <AlertDialog.Dialog className="max-w-sm">
                      <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>Delete this blob from Walrus?</AlertDialog.Heading>
                      </AlertDialog.Header>
                      <AlertDialog.Body>
                        <p className="text-sm text-ink-subtle">
                          The bytes become unretrievable and the storage is reclaimed. Any FileRecord
                          pointing at it will stop resolving.
                        </p>
                      </AlertDialog.Body>
                      <AlertDialog.Footer>
                        <Button slot="close" variant="ghost">
                          Cancel
                        </Button>
                        <Button slot="close" variant="danger" onPress={() => run(b, "delete")}>
                          Delete
                        </Button>
                      </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                  </AlertDialog.Container>
                </AlertDialog.Backdrop>
              </AlertDialog>
            )}
          </div>
        );
      })}
      {error && <p className="px-2 text-[11px] text-danger">{error}</p>}
    </div>
  );
}
