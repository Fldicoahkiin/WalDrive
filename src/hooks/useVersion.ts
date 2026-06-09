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
 * Upload fresh bytes for an existing file and link them as the next version
 * (file_record::create_version). The old record stays on chain as history and
 * drops out of the main list (useFiles hides superseded versions).
 */
export function useVersion() {
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

  const uploadVersion = useCallback(
    async (oldObjectId: string, file: File) => {
      if (!keypair || !address || !packageId) {
        setError("Wallet not ready.");
        setStatus("failed");
        return false;
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
          target: `${packageId}::${CONTRACT.FILE_RECORD}::create_version`,
          arguments: [
            tx.object(oldObjectId),
            tx.pure.string(blobId),
            tx.pure.u64(BigInt(bytes.length)),
            tx.pure.u64(BigInt(epochs)),
            tx.object(SUI_CLOCK_ID),
          ],
        });
        const { digest } = await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
        await suiClient.waitForTransaction({ digest });
        setStatus("done");
        await queryClient.invalidateQueries({ queryKey: ["files", address] });
        setTimeout(() => setStatus("idle"), 1200);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "New version failed.");
        setStatus("failed");
        return false;
      }
    },
    [keypair, address, publisher, publisherToken, epochs, packageId, suiClient, queryClient],
  );

  return { uploadVersion, status, error };
}
