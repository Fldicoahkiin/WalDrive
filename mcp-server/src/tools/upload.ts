import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SuiObjectChange } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { z } from "zod";
import { uploadBlob, WALRUS, blobUrl, CONTRACT } from "@waldrive/shared";
import { getContext } from "../lib/context";
import { mimeFromPath } from "../lib/mime";
import { textResult, errorResult, describeError } from "../lib/result";

const SUI_CLOCK_ID = "0x6";

/** objectId of the newly created FileRecord, if the tx minted one. */
function createdFileRecordId(changes: SuiObjectChange[] | null | undefined, packageId: string): string | null {
  const suffix = `${packageId}::${CONTRACT.FILE_RECORD}::FileRecord`;
  for (const change of changes ?? []) {
    if (change.type === "created" && change.objectType === suffix) {
      return change.objectId;
    }
  }
  return null;
}

const inputSchema = {
  path: z.string().describe("Local file path to upload"),
  name: z.string().optional().describe("Display name (defaults to the file's basename)"),
};

export function registerUploadTool(server: McpServer): void {
  server.registerTool(
    "upload_file",
    {
      description:
        "Upload a local file to Walrus decentralized storage and register its metadata as a FileRecord on Sui. Signs one transaction with the configured wallet (spends gas).",
      inputSchema,
    },
    async ({ path, name }) => {
      try {
        const { client, keypair, address, packageId } = getContext();

        const bytes = new Uint8Array(await readFile(path));
        const size = bytes.byteLength;
        const mime = mimeFromPath(path);
        const displayName = name ?? basename(path);

        const blobId = await uploadBlob(bytes, { sendObjectTo: address });

        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::${CONTRACT.FILE_RECORD}::register`,
          arguments: [
            tx.pure.string(blobId),
            tx.pure.string(displayName),
            tx.pure.string(mime),
            tx.pure.u64(BigInt(size)),
            tx.pure.u64(BigInt(WALRUS.EPOCHS_DEFAULT)),
            tx.object(SUI_CLOCK_ID),
          ],
        });

        const res = await client.signAndExecuteTransaction({
          signer: keypair,
          transaction: tx,
          options: { showEffects: true, showObjectChanges: true },
        });

        const objectId = createdFileRecordId(res.objectChanges, packageId);

        return textResult(
          [
            `Uploaded "${displayName}" (${size} bytes, ${mime}).`,
            `blobId: ${blobId}`,
            `FileRecord objectId: ${objectId ?? "(not found in objectChanges)"}`,
            `digest: ${res.digest}`,
            `url: ${blobUrl(blobId)}`,
          ].join("\n"),
        );
      } catch (err) {
        return errorResult(`upload_file failed: ${describeError(err)}`);
      }
    },
  );
}
