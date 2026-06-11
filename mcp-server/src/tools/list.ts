import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SuiObjectResponse } from "@mysten/sui/jsonRpc";
import { z } from "zod";
import { CONTRACT, type BlobFile } from "@waldrive/shared";
import { getContext } from "../lib/context";
import { textResult, errorResult, describeError } from "../lib/result";

const DEFAULT_LIMIT = 50;

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
    tags: [],
    owner: String(f.owner ?? ""),
    uploadedAtMs: Number(f.uploaded_at_ms ?? 0),
    expiryEpoch: Number(f.expiry_epoch ?? 0),
    isPublic: Boolean(f.is_public ?? false),
    status: "done",
  };
}

const inputSchema = {
  limit: z.number().int().positive().optional().describe("Max files to return (default 50)"),
};

export function registerListTool(server: McpServer): void {
  server.registerTool(
    "list_files",
    {
      description: "List FileRecord files owned by the configured wallet, newest first.",
      inputSchema,
    },
    async ({ limit }) => {
      try {
        const { client, address, packageId } = getContext();
        const cap = limit ?? DEFAULT_LIMIT;
        const structType = `${packageId}::${CONTRACT.FILE_RECORD}::FileRecord`;

        const files: BlobFile[] = [];
        let cursor: string | null | undefined = null;
        do {
          const page = await client.getOwnedObjects({
            owner: address,
            filter: { StructType: structType },
            options: { showContent: true },
            cursor,
          });
          for (const item of page.data) {
            const parsed = parseFileRecord(item);
            if (parsed) files.push(parsed);
            if (files.length >= cap) break;
          }
          cursor = page.hasNextPage ? page.nextCursor : null;
        } while (cursor && files.length < cap);

        files.sort((a, b) => b.uploadedAtMs - a.uploadedAtMs);

        return textResult(JSON.stringify({ owner: address, count: files.length, files }, null, 2));
      } catch (err) {
        return errorResult(`list_files failed: ${describeError(err)}`);
      }
    },
  );
}
