import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl, type SuiObjectResponse } from "@mysten/sui/jsonRpc";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import type { SuiFolder } from "@waldrive/shared";

function parseFolder(res: SuiObjectResponse): SuiFolder | null {
  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") return null;
  const f = content.fields as Record<string, unknown>;
  return {
    objectId: res.data!.objectId,
    name: String(f.name ?? ""),
    parentId: (f.parent_id as string | null) ?? null,
    createdAtMs: Number(f.created_at_ms ?? 0),
  };
}

/** Folders owned by the local wallet (folder::Folder), name-sorted. */
export function useFolders() {
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const packageId = useSettings((s) => s.packageId);
  const suiClient = useMemo(() => new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(network), network }), [network]);

  return useQuery({
    queryKey: ["folders", address, network, packageId],
    enabled: Boolean(address && packageId),
    queryFn: async (): Promise<SuiFolder[]> => {
      const type = `${packageId}::folder::Folder`;
      const folders: SuiFolder[] = [];
      let cursor: string | null | undefined = null;
      do {
        const page = await suiClient.getOwnedObjects({
          owner: address as string,
          filter: { StructType: type },
          options: { showContent: true },
          cursor,
        });
        for (const item of page.data) {
          const parsed = parseFolder(item);
          if (parsed) folders.push(parsed);
        }
        cursor = page.hasNextPage ? page.nextCursor : null;
      } while (cursor);
      return folders.sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}
