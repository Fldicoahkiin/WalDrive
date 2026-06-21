import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { listOwnedBlobs, extendOwnedBlob } from "@/lib/walrusSdk";

type RenewStatus = "idle" | "renewing" | "done" | "failed";

/**
 * Extend a file's Walrus storage before it expires. The blob's `Blob` object is
 * in the owner's wallet (uploads use `send_object_to`), so this finds it by
 * blobId and pushes its end epoch out by the configured number of epochs.
 */
export function useRenew() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const epochs = useSettings((s) => s.epochs);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RenewStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const renew = useCallback(
    async (blobId: string) => {
      if (!keypair || !address) {
        setError("Wallet not ready.");
        setStatus("failed");
        return false;
      }
      setError(null);
      setStatus("renewing");
      try {
        const blob = (await listOwnedBlobs(address, network)).find((b) => b.blobId === blobId);
        if (!blob) {
          throw new Error("This blob's storage object isn't in your wallet — it may be publisher-held.");
        }
        await extendOwnedBlob(blob.objectId, epochs, { keypair, network });
        setStatus("done");
        await queryClient.invalidateQueries({ queryKey: ["owned-blobs", address] });
        await queryClient.invalidateQueries({ queryKey: ["files", address] });
        setTimeout(() => setStatus("idle"), 1500);
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Renew failed.";
        setError(
          /wal\b|balance|coin|insufficient/i.test(msg)
            ? "Renewing storage needs WAL in your wallet to pay for the extra epochs."
            : msg,
        );
        setStatus("failed");
        return false;
      }
    },
    [keypair, address, network, epochs, queryClient],
  );

  return { renew, status, error };
}
