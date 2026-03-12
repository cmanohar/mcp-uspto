/**
 * uspto_inventor_search — Find patents by inventor via PatentsView API.
 *
 * API key optional (free registration).
 *
 * NOTE: PatentsView is migrating to ODP by ~March 20, 2026.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface Inventor {
  inventor_id?: string;
  inventor_first_name?: string;
  inventor_last_name?: string;
  inventor_total_num_patents?: number;
  inventor_lastknown_city?: string;
  inventor_lastknown_state?: string;
  inventor_lastknown_country?: string;
}

interface InventorResponse {
  inventors?: Inventor[];
  count?: number;
  total_inventor_count?: number;
}

export function registerInventorSearch(server: McpServer): void {
  server.tool(
    "uspto_inventor_search",
    "Find inventors and their patent portfolios via PatentsView. Requires free API key (set USPTO_PATENTSVIEW_API_KEY).",
    {
      first_name: z.string().optional().describe("Inventor's first name"),
      last_name: z.string().describe("Inventor's last name"),
      per_page: z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Results per page (default 25)"),
    },
    async ({ first_name, last_name, per_page }) => {
      const config = getConfig();
      if (!config.patentsviewApiKey) {
        return keyMissingResponse(
          "USPTO_PATENTSVIEW_API_KEY",
          "https://patentsview.org/apis/purpose",
          "uspto_inventor_search",
        );
      }

      const conditions: Array<Record<string, unknown>> = [
        { _text_any: { inventor_last_name: last_name } },
      ];
      if (first_name) {
        conditions.push({ _text_any: { inventor_first_name: first_name } });
      }

      const body = {
        q: conditions.length === 1 ? conditions[0] : { _and: conditions },
        f: [
          "inventor_id",
          "inventor_first_name",
          "inventor_last_name",
          "inventor_total_num_patents",
          "inventor_lastknown_city",
          "inventor_lastknown_state",
          "inventor_lastknown_country",
        ],
        o: { per_page },
        s: [{ inventor_total_num_patents: "desc" }],
      };

      const res = await fetch("https://api.patentsview.org/inventors/query", {
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

      const data = (await res.json()) as InventorResponse;

      const inventors = (data.inventors ?? []).map((i) => ({
        inventor_id: i.inventor_id ?? null,
        name: `${i.inventor_first_name ?? ""} ${i.inventor_last_name ?? ""}`.trim(),
        total_patents: i.inventor_total_num_patents ?? null,
        city: i.inventor_lastknown_city ?? null,
        state: i.inventor_lastknown_state ?? null,
        country: i.inventor_lastknown_country ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                query: { first_name, last_name },
                total_count: data.total_inventor_count ?? inventors.length,
                showing: inventors.length,
                inventors,
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
