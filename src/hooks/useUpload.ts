"use client";

import { useCallback, useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { uploadBlob } from "@waldrive/shared";
import type { UploadStatus } from "@waldrive/shared";
import { CONTRACT, WALRUS } from "@/lib/constants";

const SUI_CLOCK_ID = "0x6";

/**
 * MVP upload: PUT bytes to the Walrus publisher (publisher fronts WAL, blob object
 * sent to the user), then one wallet-signed file_record::register tx.
 */
export function useUpload() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!account) {
        setError("Connect a wallet first.");
        setStatus("failed");
        return;
      }
      setError(null);
      try {
        setStatus("uploading");
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blobId = await uploadBlob(bytes, { sendObjectTo: account.address });

        setStatus("saving_meta");
        const tx = new Transaction();
        tx.moveCall({
          target: `${CONTRACT.PACKAGE_ID}::${CONTRACT.FILE_RECORD}::register`,
          arguments: [
            tx.pure.string(blobId),
            tx.pure.string(file.name),
            tx.pure.string(file.type || "application/octet-stream"),
            tx.pure.u64(file.size),
            // expiry_epoch placeholder; Roadmap: thread the publisher's storage.endEpoch through uploadBlob
            tx.pure.u64(WALRUS.EPOCHS_DEFAULT),
            tx.object(SUI_CLOCK_ID),
          ],
        });
        await signAndExecute({ transaction: tx });

        setStatus("done");
        await queryClient.invalidateQueries({ queryKey: ["files", account.address] });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
        setStatus("failed");
      }
    },
    [account, signAndExecute, queryClient],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { upload, status, error, reset };
}
