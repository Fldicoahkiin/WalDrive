import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SuiObjectResponse } from "@mysten/sui/jsonRpc";
import { z } from "zod";
import { blobUrl, type BlobFile } from "@waldrive/shared";
import { getContext } from "../lib/context";
import { textResult, errorResult, describeError } from "../lib/result";

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
  object_id: z.string().describe("FileRecord object ID on Sui"),
};

export function registerInfoTool(server: McpServer): void {
  server.registerTool(
    "get_file_info",
    {
      description: "Get a file's on-chain metadata and its public read URL by FileRecord object ID.",
      inputSchema,
    },
    async ({ object_id }) => {
      try {
        const { client } = getContext();
        const res = await client.getObject({ id: object_id, options: { showContent: true } });
        const file = parseFileRecord(res);
        if (!file) {
          return errorResult(`get_file_info: ${object_id} is not a FileRecord object`);
        }
        return textResult(JSON.stringify({ ...file, url: blobUrl(file.blobId) }, null, 2));
      } catch (err) {
        return errorResult(`get_file_info failed: ${describeError(err)}`);
      }
    },
  );
}
