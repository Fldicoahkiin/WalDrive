"use client";

import { useQuery } from "@tanstack/react-query";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import type { SuiObjectResponse } from "@mysten/sui/client";
import { CONTRACT } from "@/lib/constants";
import type { BlobFile } from "@waldrive/shared";

const FILE_RECORD_TYPE = `${CONTRACT.PACKAGE_ID}::${CONTRACT.FILE_RECORD}::FileRecord`;

/** Parse a FileRecord move object into a BlobFile. u64 fields arrive as strings. */
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
    tags: [], // FileRecord has no tags in the MVP contract (Roadmap)
    owner: String(f.owner ?? ""),
    uploadedAtMs: Number(f.uploaded_at_ms ?? 0),
    expiryEpoch: Number(f.expiry_epoch ?? 0),
    isPublic: Boolean(f.is_public ?? false),
    status: "done",
  };
}

/** Owned FileRecord objects for the connected wallet, newest first. Paginates via cursor. */
export function useFiles() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const owner = account?.address;

  return useQuery({
    queryKey: ["files", owner],
    enabled: Boolean(owner && CONTRACT.PACKAGE_ID),
    queryFn: async (): Promise<BlobFile[]> => {
      const files: BlobFile[] = [];
      let cursor: string | null | undefined = null;
      do {
        const page = await client.getOwnedObjects({
          owner: owner as string,
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
