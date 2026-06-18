import { useQuery } from "@tanstack/react-query";
import type { SuiObjectResponse } from "@mysten/sui/jsonRpc";
import { useSuiClient } from "@/lib/suiClient";
import { useSettings } from "@/stores/settingsStore";

export interface FileVersion {
  objectId: string;
  blobId: string;
  version: number;
  size: number;
  uploadedAtMs: number;
  expiryEpoch: number;
}

function parseVersion(res: SuiObjectResponse): FileVersion | null {
  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") return null;
  const f = content.fields as Record<string, unknown>;
  return {
    objectId: res.data!.objectId,
    blobId: String(f.blob_id ?? ""),
    version: Number(f.version ?? 1),
    size: Number(f.size ?? 0),
    uploadedAtMs: Number(f.uploaded_at_ms ?? 0),
    expiryEpoch: Number(f.expiry_epoch ?? 0),
  };
}

function parentOf(res: SuiObjectResponse): string | null {
  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") return null;
  const f = content.fields as Record<string, unknown>;
  return (f.parent_version_id as string | null) ?? null;
}

const MAX_DEPTH = 20;

/**
 * Walk the on-chain parent_version_id chain of a FileRecord and return the
 * previous versions, newest first. Old records stay on chain (create_version
 * never destroys), so the whole history is verifiable.
 */
export function useVersionHistory(parentVersionId: string | null | undefined) {
  const network = useSettings((s) => s.network);
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ["version-history", parentVersionId, network],
    enabled: Boolean(parentVersionId),
    staleTime: 60_000,
    queryFn: async (): Promise<FileVersion[]> => {
      const chain: FileVersion[] = [];
      let cursor: string | null = parentVersionId ?? null;
      for (let i = 0; cursor && i < MAX_DEPTH; i++) {
        const res: SuiObjectResponse = await suiClient.getObject({
          id: cursor,
          options: { showContent: true },
        });
        const v = parseVersion(res);
        if (!v) break;
        chain.push(v);
        cursor = parentOf(res);
      }
      return chain;
    },
  });
}
