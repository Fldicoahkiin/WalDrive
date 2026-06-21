import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient } from "@/lib/suiClient";
import { uploadBlob } from "@waldrive/shared";
import type { UploadStatus } from "@waldrive/shared";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { uploadBlobWithWallet } from "@/lib/walrusSdk";
import { sealEncrypt } from "@/lib/seal";
import { CONTRACT } from "@/lib/constants";

const SUI_CLOCK_ID = "0x6";

/**
 * Desktop upload, two paths to Walrus picked in Settings:
 * - publisher: HTTP PUT, the publisher fronts the WAL cost (testnet default)
 * - wallet: encode locally via the Walrus SDK, the user's wallet pays WAL
 * Either way file_record::register is then signed in-process.
 */
export function useUpload() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const publisher = useSettings((s) => s.publisher);
  const publisherToken = useSettings((s) => s.publisherToken);
  const epochs = useSettings((s) => s.epochs);
  const packageId = useSettings((s) => s.packageId);
  const uploadMethod = useSettings((s) => s.uploadMethod);
  const encrypt = useSettings((s) => s.encrypt);
  const queryClient = useQueryClient();
  const suiClient = useSuiClient();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsGas, setNeedsGas] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (!keypair || !address) {
        setError("Wallet not ready.");
        setStatus("failed");
        return false;
      }
      if (!packageId) {
        setError("No contract package configured (see Settings).");
        setStatus("failed");
        return false;
      }
      setError(null);
      setNeedsGas(false);
      let phase: "walrus" | "sui" = "walrus";
      try {
        setStatus("uploading");
        let bytes = new Uint8Array(await file.arrayBuffer());
        if (encrypt) {
          bytes = await sealEncrypt(bytes, { owner: address, packageId, suiClient });
        }
        const { blobId, endEpoch } =
          uploadMethod === "wallet"
            ? await uploadBlobWithWallet(bytes, { keypair, network, epochs })
            : await uploadBlob(bytes, {
                sendObjectTo: address,
                publisher,
                epochs,
                authToken: publisherToken,
              });

        phase = "sui";
        setStatus("saving_meta");
        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::${CONTRACT.FILE_RECORD}::register`,
          arguments: [
            tx.pure.string(blobId),
            tx.pure.string(file.name),
            tx.pure.string(file.type || "application/octet-stream"),
            tx.pure.u64(BigInt(file.size)),
            tx.pure.u64(BigInt(endEpoch ?? 0)),
            tx.pure.bool(encrypt),
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
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Upload failed.";
        if (phase === "sui" && /gas|insufficient/i.test(message)) {
          // The blob IS on Walrus by now; only the on-chain record needs gas.
          setNeedsGas(true);
          setError("Stored on Walrus, but recording it on Sui needs a little SUI for gas.");
        } else if (phase === "walrus" && uploadMethod === "wallet" && /gas/i.test(message)) {
          // SDK register/certify gas — the wallet is short on SUI, not WAL.
          setNeedsGas(true);
          setError("Wallet upload needs a little SUI for gas before it can store anything.");
        } else if (phase === "walrus" && uploadMethod === "wallet" && /wal\b|balance|coin/i.test(message)) {
          setError(
            "Wallet upload needs WAL in this wallet to pay for storage — swap some, or switch Upload via back to Publisher (free) in Settings.",
          );
        } else {
          setError(message);
        }
        setStatus("failed");
        return false;
      }
    },
    [keypair, address, network, publisher, publisherToken, epochs, packageId, uploadMethod, encrypt, suiClient, queryClient],
  );

  return {
    upload,
    status,
    error,
    needsGas,
    reset: () => {
      setStatus("idle");
      setError(null);
      setNeedsGas(false);
    },
  };
}
