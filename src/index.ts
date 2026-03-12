#!/usr/bin/env node

/**
 * mcp-uspto — MCP server for USPTO patent search, trademarks, assignments, and PTAB.
 *
 * ODP tools (free API key — set USPTO_API_KEY): patent search, details, documents,
 *   assignments, status, continuity, foreign priority, PTAB decisions, PTAB proceedings.
 *   Register at https://data.uspto.gov/apis/getting-started
 * PatentsView tools (free key — set USPTO_PATENTSVIEW_API_KEY): patentsview search,
 *   inventor search, assignee search.
 * TSDR tools (free key — set USPTO_TSDR_API_KEY): trademark status.
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
import { registerPatentContinuity } from "./tools/patent-continuity.js";
import { registerPatentForeignPriority } from "./tools/patent-foreign-priority.js";
import { registerPtabDecisions } from "./tools/ptab-decisions.js";
import { registerPtabProceedings } from "./tools/ptab-proceedings.js";
import { registerTrademarkStatus } from "./tools/trademark-status.js";

const server = new McpServer({
  name: "mcp-uspto",
  version: "0.1.1",
});

// ODP tools: require free API key (USPTO_API_KEY)
registerPatentSearch(server);
registerPatentDetails(server);
registerPatentDocuments(server);
registerPatentAssignments(server);
registerPatentStatus(server);
registerPatentContinuity(server);
registerPatentForeignPriority(server);
registerPtabDecisions(server);
registerPtabProceedings(server);

// PatentsView tools: require free API key (USPTO_PATENTSVIEW_API_KEY)
registerPatentsviewSearch(server);
registerInventorSearch(server);
registerAssigneeSearch(server);

// TSDR tools: require free API key (USPTO_TSDR_API_KEY)
registerTrademarkStatus(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-uspto server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
