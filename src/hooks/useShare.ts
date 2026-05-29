"use client";

import { useCallback, useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT } from "@/lib/constants";
import type { BlobFile } from "@waldrive/shared";

const SUI_CLOCK_ID = "0x6";
type ShareStatus = "idle" | "sharing" | "done" | "failed";

/**
 * Create a ShareLink for a file. Its objectId becomes the share URL (/drive/{objectId});
 * no registry. Returns the new objectId once the tx lands.
 */
export function useShare() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [objectId, setObjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(
    async (file: BlobFile) => {
      if (!account) return;
      setStatus("sharing");
      setError(null);
      setObjectId(null);
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${CONTRACT.PACKAGE_ID}::${CONTRACT.SHARE_LINK}::create`,
          arguments: [
            tx.pure.id(file.objectId),
            tx.pure.string(file.blobId),
            tx.pure.string(file.name),
            tx.object(SUI_CLOCK_ID),
          ],
        });
        const { digest } = await signAndExecute({ transaction: tx });
        const tb = await client.waitForTransaction({
          digest,
          options: { showObjectChanges: true },
        });
        const created = tb.objectChanges?.find(
          (c) => c.type === "created" && c.objectType.endsWith(`::${CONTRACT.SHARE_LINK}::ShareLink`),
        );
        const id = created && created.type === "created" ? created.objectId : null;
        if (!id) throw new Error("ShareLink not found in transaction result");
        setObjectId(id);
        setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Share failed.");
        setStatus("failed");
      }
    },
    [account, client, signAndExecute],
  );

  return { share, status, objectId, error };
}
