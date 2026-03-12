/**
 * uspto_patent_search — Search patents via the USPTO Open Data Portal.
 *
 * Requires a free API key (set USPTO_API_KEY).
 * Entry point for patent research — returns application numbers that can be
 * used with patent-details, patent-documents, and patent-status.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoPostJson } from "../lib/fetcher.js";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface SearchResult {
  applicationNumberText?: string;
  inventionTitle?: string;
  filingDate?: string;
  patentNumber?: string;
  applicationStatusCategory?: string;
  inventorNameArrayText?: string[];
  assigneeEntityName?: string;
}

interface SearchResponse {
  count?: number;
  patentFileWrapperSearchResults?: SearchResult[];
}

export function registerPatentSearch(server: McpServer): void {
  server.tool(
    "uspto_patent_search",
    "Search USPTO patents by keyword. Returns application numbers, titles, inventors, and status. Requires free API key (set USPTO_API_KEY). Use the returned application numbers with uspto_patent_details, uspto_patent_documents, and uspto_patent_status.",
    {
      query: z.string().describe("Search query — keywords, patent number, or application number"),
      start: z
        .number()
        .min(0)
        .default(0)
        .describe("Starting offset for pagination (default 0)"),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe("Max results to return (default 20, max 50)"),
    },
    async ({ query, start, limit }) => {
      const config = getConfig();
      if (!config.odpApiKey) {
        return keyMissingResponse(
          "USPTO_API_KEY",
          "https://data.uspto.gov/apis/getting-started",
          "uspto_patent_search",
        );
      }

      const data = await usptoPostJson<SearchResponse>(
        "https://api.uspto.gov/api/v1/patent-applications/search",
        {
          apiType: "odp",
          apiKey: config.odpApiKey,
          apiKeyHeader: "X-API-Key",
          body: {
            q: query,
            pagination: { offset: start, limit },
          },
        },
      );

      const results = (data.patentFileWrapperSearchResults ?? []).map((r) => ({
        application_number: r.applicationNumberText ?? null,
        title: r.inventionTitle ?? null,
        filing_date: r.filingDate ?? null,
        patent_number: r.patentNumber ?? null,
        status: r.applicationStatusCategory ?? null,
        inventors: r.inventorNameArrayText ?? [],
        assignee: r.assigneeEntityName ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                query,
                total_count: data.count ?? results.length,
                start,
                limit,
                results,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
