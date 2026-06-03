import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@/stores/walletStore";
import { CONTRACT, SUI_NETWORK } from "@/lib/constants";

const suiClient = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });

type DeleteStatus = "idle" | "deleting" | "failed";

/**
 * Hard-delete a FileRecord on Sui: file_record::delete(record) consumes the
 * owned object. The Walrus blob itself lingers until its epoch lapses; this
 * only removes the on-chain record. waitForTransaction before invalidate so the
 * refetch no longer returns the deleted record.
 */
export function useDelete() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DeleteStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (objectId: string) => {
      if (!keypair || !address) {
        setError("Wallet not ready.");
        setStatus("failed");
        return false;
      }
      setError(null);
      try {
        setStatus("deleting");
        const tx = new Transaction();
        tx.moveCall({
          target: `${CONTRACT.PACKAGE_ID}::${CONTRACT.FILE_RECORD}::delete`,
          arguments: [tx.object(objectId)],
        });
        const { digest } = await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
        await suiClient.waitForTransaction({ digest });

        setStatus("idle");
        await queryClient.invalidateQueries({ queryKey: ["files", address] });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed.");
        setStatus("failed");
        return false;
      }
    },
    [keypair, address, queryClient],
  );

  return { remove, status, error };
}
