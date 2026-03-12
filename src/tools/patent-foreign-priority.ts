/**
 * uspto_patent_foreign_priority — Get foreign priority claims from the USPTO Open Data Portal.
 *
 * Requires a free API key (set USPTO_API_KEY).
 * Returns foreign application priority claims linked to a US patent application.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface ForeignPriorityRecord {
  foreignApplicationNumber?: string;
  foreignFilingDate?: string;
  countryCode?: string;
  countryName?: string;
  priorityClaimDate?: string;
}

interface ForeignPriorityResponse {
  foreignPriorityBag?: ForeignPriorityRecord[];
}

export function registerPatentForeignPriority(server: McpServer): void {
  server.tool(
    "uspto_patent_foreign_priority",
    "Get foreign priority claims for a US patent application — shows linked international filings by country and date. Useful for tracking global IP strategy. Requires free API key (set USPTO_API_KEY).",
    {
      application_number: z
        .string()
        .describe("USPTO application number (e.g. '16123456' or '16/123,456')"),
    },
    async ({ application_number }) => {
      const config = getConfig();
      if (!config.odpApiKey) {
        return keyMissingResponse(
          "USPTO_API_KEY",
          "https://data.uspto.gov/apis/getting-started",
          "uspto_patent_foreign_priority",
        );
      }

      const cleaned = application_number.replace(/[/,\s]/g, "");

      const data = await usptoFetchJson<ForeignPriorityResponse>(
        `https://api.uspto.gov/api/v1/patent-applications/${cleaned}/foreign-priority`,
        { apiType: "odp", apiKey: config.odpApiKey, apiKeyHeader: "X-API-Key" },
      );

      const claims = (data.foreignPriorityBag ?? []).map((r) => ({
        foreign_application_number: r.foreignApplicationNumber ?? null,
        foreign_filing_date: r.foreignFilingDate ?? null,
        country_code: r.countryCode ?? null,
        country_name: r.countryName ?? null,
        priority_claim_date: r.priorityClaimDate ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                application_number: cleaned,
                claim_count: claims.length,
                foreign_priority_claims: claims,
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
