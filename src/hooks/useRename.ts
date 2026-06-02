import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@/stores/walletStore";
import { CONTRACT, SUI_NETWORK } from "@/lib/constants";

const suiClient = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });

type RenameStatus = "idle" | "saving" | "done" | "failed";

/**
 * Rename a FileRecord on Sui: file_record::rename(record, new_name), signed
 * in-process by the local keypair. waitForTransaction before invalidate so the
 * indexer reflects the new name on refetch (same lag fix as useUpload).
 */
export function useRename() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RenameStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const rename = useCallback(
    async (objectId: string, newName: string) => {
      if (!keypair || !address) {
        setError("Wallet not ready.");
        setStatus("failed");
        return false;
      }
      setError(null);
      try {
        setStatus("saving");
        const tx = new Transaction();
        tx.moveCall({
          target: `${CONTRACT.PACKAGE_ID}::${CONTRACT.FILE_RECORD}::rename`,
          arguments: [tx.object(objectId), tx.pure.string(newName)],
        });
        const { digest } = await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
        await suiClient.waitForTransaction({ digest });

        setStatus("done");
        await queryClient.invalidateQueries({ queryKey: ["files", address] });
        setTimeout(() => setStatus("idle"), 1000);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Rename failed.");
        setStatus("failed");
        return false;
      }
    },
    [keypair, address, queryClient],
  );

  return { rename, status, error };
}
