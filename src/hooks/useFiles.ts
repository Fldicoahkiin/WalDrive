import { useQuery } from "@tanstack/react-query";
import { SuiClient, getFullnodeUrl, type SuiObjectResponse } from "@mysten/sui/client";
import { useWallet } from "@/stores/walletStore";
import { CONTRACT, SUI_NETWORK } from "@/lib/constants";
import type { BlobFile } from "@waldrive/shared";

const suiClient = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
const FILE_RECORD_TYPE = `${CONTRACT.PACKAGE_ID}::${CONTRACT.FILE_RECORD}::FileRecord`;

/** u64 move fields arrive as strings — Number() them. */
function parseFileRecord(res: SuiObjectResponse): BlobFile | null {
  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") return null;
  const f = content.fields as Record<string, unknown>;
  return {
    objectId: res.data!.objectId,
    blobId: String(f.blob_id ?? ""),
    name: String(f.name ?? ""),
    mimeType: String(f.mime_type ?? ""),
    size: Number(f.size ?? 0),
    folderId: (f.folder_id as string | null) ?? null,
    tags: [],
    owner: String(f.owner ?? ""),
    uploadedAtMs: Number(f.uploaded_at_ms ?? 0),
    expiryEpoch: Number(f.expiry_epoch ?? 0),
    isPublic: Boolean(f.is_public ?? false),
    status: "done",
  };
}

/** Files owned by the local wallet, newest first, cursor-paginated. */
export function useFiles() {
  const address = useWallet((s) => s.address);
  return useQuery({
    queryKey: ["files", address],
    enabled: Boolean(address && CONTRACT.PACKAGE_ID),
    queryFn: async (): Promise<BlobFile[]> => {
      const files: BlobFile[] = [];
      let cursor: string | null | undefined = null;
      do {
        const page = await suiClient.getOwnedObjects({
          owner: address as string,
          filter: { StructType: FILE_RECORD_TYPE },
          options: { showContent: true },
          cursor,
        });
        for (const item of page.data) {
          const parsed = parseFileRecord(item);
          if (parsed) files.push(parsed);
        }
        cursor = page.hasNextPage ? page.nextCursor : null;
      } while (cursor);
      return files.sort((a, b) => b.uploadedAtMs - a.uploadedAtMs);
    },
  });
}
