/**
 * uspto_patentsview_search — Rich patent search via PatentsView API.
 *
 * API key optional (free registration). Provides richer search capabilities
 * than the Open Data Portal including CPC classification filtering.
 *
 * NOTE: PatentsView is migrating to ODP by ~March 20, 2026.
 * If this endpoint breaks post-migration, a v0.2.0 will update to the new ODP equivalents.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface PatentsViewPatent {
  patent_id?: string;
  patent_title?: string;
  patent_abstract?: string;
  patent_date?: string;
  patent_type?: string;
  patent_num_claims?: number;
  assignees?: Array<{ assignee_organization?: string }>;
  inventors?: Array<{
    inventor_first_name?: string;
    inventor_last_name?: string;
  }>;
}

interface PatentsViewResponse {
  patents?: PatentsViewPatent[];
  count?: number;
  total_patent_count?: number;
}

export function registerPatentsviewSearch(server: McpServer): void {
  server.tool(
    "uspto_patentsview_search",
    "Rich patent search with filters for title, abstract, CPC codes, date ranges, and assignee. Requires free API key (set USPTO_PATENTSVIEW_API_KEY). For key-free search, use uspto_patent_search instead.",
    {
      query: z.string().describe("Search keywords for patent title/abstract"),
      assignee: z
        .string()
        .optional()
        .describe("Filter by assignee/company name"),
      cpc_code: z
        .string()
        .optional()
        .describe("Filter by CPC classification code (e.g. 'A61B')"),
      date_from: z
        .string()
        .optional()
        .describe("Start date filter (YYYY-MM-DD)"),
      date_to: z
        .string()
        .optional()
        .describe("End date filter (YYYY-MM-DD)"),
      per_page: z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Results per page (default 25, max 100)"),
    },
    async ({ query, assignee, cpc_code, date_from, date_to, per_page }) => {
      const config = getConfig();
      if (!config.patentsviewApiKey) {
        return keyMissingResponse(
          "USPTO_PATENTSVIEW_API_KEY",
          "https://patentsview.org/apis/purpose",
          "uspto_patentsview_search",
        );
      }

      // Build PatentsView query filter
      const conditions: Array<Record<string, unknown>> = [
        { _or: [{ _text_any: { patent_title: query } }, { _text_any: { patent_abstract: query } }] },
      ];

      if (assignee) {
        conditions.push({ _text_any: { assignee_organization: assignee } });
      }
      if (cpc_code) {
        conditions.push({ _begins: { cpc_group_id: cpc_code } });
      }
      if (date_from) {
        conditions.push({ _gte: { patent_date: date_from } });
      }
      if (date_to) {
        conditions.push({ _lte: { patent_date: date_to } });
      }

      const body = {
        q: conditions.length === 1 ? conditions[0] : { _and: conditions },
        f: [
          "patent_id",
          "patent_title",
          "patent_abstract",
          "patent_date",
          "patent_type",
          "patent_num_claims",
          "assignees.assignee_organization",
          "inventors.inventor_first_name",
          "inventors.inventor_last_name",
        ],
        o: { per_page },
        s: [{ patent_date: "desc" }],
      };

      // PatentsView uses POST
      const res = await fetch("https://api.patentsview.org/patents/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": config.patentsviewApiKey,
          "User-Agent": "mcp-uspto/0.1.0",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`PatentsView API error: ${res.status} ${res.statusText}`);
      }

      const result = (await res.json()) as PatentsViewResponse;

      const patents = (result.patents ?? []).map((p) => ({
        patent_id: p.patent_id ?? null,
        title: p.patent_title ?? null,
        abstract: p.patent_abstract
          ? p.patent_abstract.substring(0, 500)
          : null,
        date: p.patent_date ?? null,
        type: p.patent_type ?? null,
        num_claims: p.patent_num_claims ?? null,
        assignees: (p.assignees ?? [])
          .map((a) => a.assignee_organization)
          .filter(Boolean),
        inventors: (p.inventors ?? [])
          .map(
            (i) =>
              `${i.inventor_first_name ?? ""} ${i.inventor_last_name ?? ""}`.trim(),
          )
          .filter(Boolean),
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                query,
                total_count: result.total_patent_count ?? patents.length,
                showing: patents.length,
                patents,
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
