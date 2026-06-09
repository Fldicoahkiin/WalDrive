import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { CONTRACT } from "@/lib/constants";

/** Add / remove a tag on a FileRecord (file_record::add_tag / remove_tag). */
export function useTags() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const packageId = useSettings((s) => s.packageId);
  const queryClient = useQueryClient();
  const suiClient = useMemo(() => new SuiClient({ url: getFullnodeUrl(network) }), [network]);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (fn: "add_tag" | "remove_tag", objectId: string, tag: string) => {
      const t = tag.trim();
      if (!keypair || !address || !t) return false;
      setBusy(true);
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::${CONTRACT.FILE_RECORD}::${fn}`,
          arguments: [tx.object(objectId), tx.pure.string(t)],
        });
        const { digest } = await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
        await suiClient.waitForTransaction({ digest });
        await queryClient.invalidateQueries({ queryKey: ["files", address] });
        return true;
      } catch {
        return false;
      } finally {
        setBusy(false);
      }
    },
    [keypair, address, packageId, suiClient, queryClient],
  );

  return {
    addTag: (id: string, tag: string) => run("add_tag", id, tag),
    removeTag: (id: string, tag: string) => run("remove_tag", id, tag),
    busy,
  };
}
