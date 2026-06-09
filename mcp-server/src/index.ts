#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerUploadTool } from "./tools/upload";
import { registerListTool } from "./tools/list";
import { registerDownloadTool } from "./tools/download";
import { registerInfoTool } from "./tools/info";

async function main(): Promise<void> {
  const server = new McpServer({
    name: "waldrive",
    version: "0.1.0",
  });

  registerUploadTool(server);
  registerListTool(server);
  registerDownloadTool(server);
  registerInfoTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // stderr only — stdout is the MCP protocol channel. Never echo secrets.
  console.error(`waldrive MCP server failed to start: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
