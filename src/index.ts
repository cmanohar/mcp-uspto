#!/usr/bin/env node

/**
 * mcp-uspto — MCP server for USPTO patent search, trademarks, assignments, and PTAB.
 *
 * Tier 1 tools (no API key): patent search, details, documents, assignments, status.
 * Tier 2 tools (free key): PatentsView search, inventor/assignee search, TSDR, PTAB.
 *
 * Usage:
 *   npx mcp-uspto              # stdio transport (for Claude Code, Cursor, etc.)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerPatentSearch } from "./tools/patent-search.js";
import { registerPatentDetails } from "./tools/patent-details.js";
import { registerPatentDocuments } from "./tools/patent-documents.js";
import { registerPatentAssignments } from "./tools/patent-assignments.js";
import { registerPatentStatus } from "./tools/patent-status.js";
import { registerPatentsviewSearch } from "./tools/patentsview-search.js";
import { registerInventorSearch } from "./tools/inventor-search.js";
import { registerAssigneeSearch } from "./tools/assignee-search.js";
import { registerTrademarkStatus } from "./tools/trademark-status.js";
import { registerPtabDecisions } from "./tools/ptab-decisions.js";

const server = new McpServer({
  name: "mcp-uspto",
  version: "0.1.0",
});

// Tier 1: No API key required (Open Data Portal)
registerPatentSearch(server);
registerPatentDetails(server);
registerPatentDocuments(server);
registerPatentAssignments(server);
registerPatentStatus(server);

// Tier 2: Optional API key (free registration)
registerPatentsviewSearch(server);
registerInventorSearch(server);
registerAssigneeSearch(server);
registerTrademarkStatus(server);
registerPtabDecisions(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-uspto server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
