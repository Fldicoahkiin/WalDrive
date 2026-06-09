import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { blobUrl } from "@waldrive/shared";
import { textResult, errorResult, describeError } from "../lib/result";

const inputSchema = {
  blob_id: z.string().describe("Walrus blob ID to download"),
  output_path: z.string().optional().describe("Local file path to write (default: ./<blob_id>)"),
};

export function registerDownloadTool(server: McpServer): void {
  server.registerTool(
    "download_file",
    {
      description: "Download a blob from Walrus by blob ID and write it to a local file.",
      inputSchema,
    },
    async ({ blob_id, output_path }) => {
      try {
        const res = await fetch(blobUrl(blob_id));
        if (!res.ok) {
          return errorResult(`download_file failed: HTTP ${res.status} ${res.statusText} for ${blob_id}`);
        }
        const bytes = new Uint8Array(await res.arrayBuffer());
        const path = resolve(output_path ?? `./${blob_id}`);
        await writeFile(path, bytes);
        return textResult(JSON.stringify({ blobId: blob_id, path, bytes: bytes.length }, null, 2));
      } catch (err) {
        return errorResult(`download_file failed: ${describeError(err)}`);
      }
    },
  );
}
