import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** A plain text tool result. */
export function textResult(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

/** A tool result flagged as an error so the client can self-correct. */
export function errorResult(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Extract a readable message from an unknown caught value. */
export function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
