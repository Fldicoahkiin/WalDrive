import { useQuery } from "@tanstack/react-query";
import type { SuiObjectResponse } from "@mysten/sui/jsonRpc";
import { useSuiClient } from "@/lib/suiClient";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { CONTRACT, DEMO_ADDRESS } from "@/lib/constants";
import type { BlobFile } from "@waldrive/shared";

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
    tags: Array.isArray(f.tags) ? (f.tags as string[]) : [],
    owner: String(f.owner ?? ""),
    uploadedAtMs: Number(f.uploaded_at_ms ?? 0),
    expiryEpoch: Number(f.expiry_epoch ?? 0),
    isPublic: Boolean(f.is_public ?? false),
    isDeleted: Boolean(f.is_deleted ?? false),
    version: Number(f.version ?? 1),
    parentVersionId: (f.parent_version_id as string | null) ?? null,
    status: "done",
  };
}

/** Files owned by the active wallet (or the read-only demo address), newest first. */
export function useFiles() {
  const address = useWallet((s) => s.address) ?? DEMO_ADDRESS;
  const network = useSettings((s) => s.network);
  const packageId = useSettings((s) => s.packageId);
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ["files", address, network, packageId],
    enabled: Boolean(address && packageId),
    queryFn: async (): Promise<BlobFile[]> => {
      const type = `${packageId}::${CONTRACT.FILE_RECORD}::FileRecord`;
      const files: BlobFile[] = [];
      let cursor: string | null | undefined = null;
      do {
        const page = await suiClient.getOwnedObjects({
          owner: address as string,
          filter: { StructType: type },
          options: { showContent: true },
          cursor,
        });
        for (const item of page.data) {
          const parsed = parseFileRecord(item);
          if (parsed) files.push(parsed);
        }
        cursor = page.hasNextPage ? page.nextCursor : null;
      } while (cursor);
      // Hide superseded versions — show only the latest of each version chain.
      const superseded = new Set(files.map((f) => f.parentVersionId).filter(Boolean));
      return files
        .filter((f) => !superseded.has(f.objectId))
        .sort((a, b) => b.uploadedAtMs - a.uploadedAtMs);
    },
  });
}
