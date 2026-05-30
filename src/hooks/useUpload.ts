import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { uploadBlob } from "@waldrive/shared";
import type { UploadStatus } from "@waldrive/shared";
import { useWallet } from "@/stores/walletStore";
import { CONTRACT, WALRUS, SUI_NETWORK } from "@/lib/constants";

const suiClient = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
const SUI_CLOCK_ID = "0x6";

/**
 * Desktop upload: PUT bytes to the Walrus publisher (blob sent to the local
 * wallet), then file_record::register signed in-process by the local keypair.
 * No wallet popup — the app holds the key.
 */
export function useUpload() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!keypair || !address) {
        setError("Wallet not ready.");
        setStatus("failed");
        return;
      }
      setError(null);
      try {
        setStatus("uploading");
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blobId = await uploadBlob(bytes, { sendObjectTo: address });

        setStatus("saving_meta");
        const tx = new Transaction();
        tx.moveCall({
          target: `${CONTRACT.PACKAGE_ID}::${CONTRACT.FILE_RECORD}::register`,
          arguments: [
            tx.pure.string(blobId),
            tx.pure.string(file.name),
            tx.pure.string(file.type || "application/octet-stream"),
            tx.pure.u64(BigInt(file.size)),
            tx.pure.u64(BigInt(WALRUS.EPOCHS_DEFAULT)),
            tx.object(SUI_CLOCK_ID),
          ],
        });
        await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });

        setStatus("done");
        await queryClient.invalidateQueries({ queryKey: ["files", address] });
        setTimeout(() => setStatus("idle"), 1200);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
        setStatus("failed");
      }
    },
    [keypair, address, queryClient],
  );

  return { upload, status, error, reset: () => { setStatus("idle"); setError(null); } };
}
