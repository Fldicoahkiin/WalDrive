import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient } from "@/lib/suiClient";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { CONTRACT } from "@/lib/constants";

const SUI_CLOCK_ID = "0x6";
type DeleteStatus = "idle" | "deleting" | "failed";

/**
 * FileRecord deletion lifecycle, signed in-process:
 * - trash   → soft_delete (kept on chain, filtered out of the main view)
 * - restore → un-delete
 * - purge   → delete (hard, consumes the object)
 * The Walrus blob lingers until its epoch lapses regardless. waitForTransaction
 * before invalidate so the refetch reflects the change.
 */
export function useDelete() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const packageId = useSettings((s) => s.packageId);
  const queryClient = useQueryClient();
  const suiClient = useSuiClient();
  const [status, setStatus] = useState<DeleteStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (fn: "soft_delete" | "restore" | "delete", objectId: string) => {
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
          target: `${packageId}::${CONTRACT.FILE_RECORD}::${fn}`,
          arguments:
            fn === "soft_delete"
              ? [tx.object(objectId), tx.object(SUI_CLOCK_ID)]
              : [tx.object(objectId)],
        });
        const { digest } = await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
        await suiClient.waitForTransaction({ digest });
        setStatus("idle");
        await queryClient.invalidateQueries({ queryKey: ["files", address] });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed.");
        setStatus("failed");
        return false;
      }
    },
    [keypair, address, packageId, suiClient, queryClient],
  );

  return {
    trash: (id: string) => run("soft_delete", id),
    restore: (id: string) => run("restore", id),
    purge: (id: string) => run("delete", id),
    status,
    error,
  };
}
