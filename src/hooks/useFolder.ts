import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";

const SUI_CLOCK_ID = "0x6";

/** Folder mutations + moving files in/out of folders, signed in-process. */
export function useFolder() {
  const keypair = useWallet((s) => s.keypair);
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const packageId = useSettings((s) => s.packageId);
  const queryClient = useQueryClient();
  const suiClient = useMemo(() => new SuiClient({ url: getFullnodeUrl(network) }), [network]);
  const [busy, setBusy] = useState(false);

  const exec = useCallback(
    async (build: (tx: Transaction) => void) => {
      if (!keypair || !address || !packageId) return false;
      setBusy(true);
      try {
        const tx = new Transaction();
        build(tx);
        const { digest } = await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
        await suiClient.waitForTransaction({ digest });
        await queryClient.invalidateQueries({ queryKey: ["folders", address] });
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
    createFolder: (name: string, parentId?: string | null) =>
      exec((tx) =>
        parentId
          ? tx.moveCall({
              target: `${packageId}::folder::create_nested`,
              arguments: [tx.pure.string(name), tx.pure.id(parentId), tx.object(SUI_CLOCK_ID)],
            })
          : tx.moveCall({
              target: `${packageId}::folder::create`,
              arguments: [tx.pure.string(name), tx.object(SUI_CLOCK_ID)],
            }),
      ),
    renameFolder: (objectId: string, name: string) =>
      exec((tx) =>
        tx.moveCall({ target: `${packageId}::folder::rename`, arguments: [tx.object(objectId), tx.pure.string(name)] }),
      ),
    deleteFolder: (objectId: string) =>
      exec((tx) => tx.moveCall({ target: `${packageId}::folder::delete`, arguments: [tx.object(objectId)] })),
    moveToFolder: (fileId: string, folderId: string) =>
      exec((tx) =>
        tx.moveCall({
          target: `${packageId}::file_record::move_to_folder`,
          arguments: [tx.object(fileId), tx.pure.id(folderId)],
        }),
      ),
    removeFromFolder: (fileId: string) =>
      exec((tx) =>
        tx.moveCall({ target: `${packageId}::file_record::remove_from_folder`, arguments: [tx.object(fileId)] }),
      ),
    busy,
  };
}
