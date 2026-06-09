import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { uploadBlob } from "@waldrive/shared";
import type { UploadStatus } from "@waldrive/shared";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { CONTRACT } from "@/lib/constants";

const SUI_CLOCK_ID = "0x6";

/**
 * Desktop upload: PUT bytes to the Walrus publisher (blob sent to the local
 * wallet), then file_record::register signed in-process by the local keypair.
 * Endpoints, epochs, network and contract all come from the settings store.
 */
export function useUpload() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const publisher = useSettings((s) => s.publisher);
  const publisherToken = useSettings((s) => s.publisherToken);
  const epochs = useSettings((s) => s.epochs);
  const packageId = useSettings((s) => s.packageId);
  const queryClient = useQueryClient();
  const suiClient = useMemo(() => new SuiClient({ url: getFullnodeUrl(network) }), [network]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!keypair || !address) {
        setError("Wallet not ready.");
        setStatus("failed");
        return;
      }
      if (!packageId) {
        setError("No contract package configured (see Settings).");
        setStatus("failed");
        return;
      }
      setError(null);
      try {
        setStatus("uploading");
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blobId = await uploadBlob(bytes, {
          sendObjectTo: address,
          publisher,
          epochs,
          authToken: publisherToken,
        });

        setStatus("saving_meta");
        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::${CONTRACT.FILE_RECORD}::register`,
          arguments: [
            tx.pure.string(blobId),
            tx.pure.string(file.name),
            tx.pure.string(file.type || "application/octet-stream"),
            tx.pure.u64(BigInt(file.size)),
            tx.pure.u64(BigInt(epochs)),
            tx.object(SUI_CLOCK_ID),
          ],
        });
        const { digest } = await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
        // getOwnedObjects reads the indexer, which lags tx execution — wait so
        // the refetch below actually returns the new FileRecord (live appear).
        await suiClient.waitForTransaction({ digest });

        setStatus("done");
        await queryClient.invalidateQueries({ queryKey: ["files", address] });
        setTimeout(() => setStatus("idle"), 1200);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
        setStatus("failed");
      }
    },
    [keypair, address, publisher, publisherToken, epochs, packageId, suiClient, queryClient],
  );

  return { upload, status, error, reset: () => { setStatus("idle"); setError(null); } };
}
