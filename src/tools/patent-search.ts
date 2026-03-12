/**
 * uspto_patent_search — Search patents via the USPTO Open Data Portal.
 *
 * No API key required. Entry point for patent research — returns application
 * numbers that can be used with patent-details, patent-documents, and patent-status.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";

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
    "Search USPTO patents by keyword. Returns application numbers, titles, inventors, and status. No API key required. Use the returned application numbers with uspto_patent_details, uspto_patent_documents, and uspto_patent_status.",
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
      const params = new URLSearchParams({
        searchText: query,
        start: String(start),
        rows: String(limit),
      });

      const data = await usptoFetchJson<SearchResponse>(
        `https://data.uspto.gov/api/v1/patent/application/search?${params}`,
        { apiType: "odp" },
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
