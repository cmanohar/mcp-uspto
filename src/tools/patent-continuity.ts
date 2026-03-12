/**
 * uspto_patent_continuity — Get parent/child application chains from the USPTO Open Data Portal.
 *
 * Requires a free API key (set USPTO_API_KEY).
 * Returns continuity data showing how patent applications are related
 * (continuations, divisionals, CIPs, provisionals).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface ContinuityRecord {
  parentApplicationNumber?: string;
  childApplicationNumber?: string;
  parentPatentNumber?: string;
  childPatentNumber?: string;
  parentFilingDate?: string;
  childFilingDate?: string;
  continuityType?: string;
  claimType?: string;
}

interface ContinuityResponse {
  continuityBag?: ContinuityRecord[];
}

export function registerPatentContinuity(server: McpServer): void {
  server.tool(
    "uspto_patent_continuity",
    "Get the patent family tree — parent/child application relationships including continuations, divisionals, CIPs, and provisional links. Requires free API key (set USPTO_API_KEY).",
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
          "uspto_patent_continuity",
        );
      }

      const cleaned = application_number.replace(/[/,\s]/g, "");

      const data = await usptoFetchJson<ContinuityResponse>(
        `https://api.uspto.gov/api/v1/patent-applications/${cleaned}/continuity`,
        { apiType: "odp", apiKey: config.odpApiKey, apiKeyHeader: "X-API-Key" },
      );

      const relationships = (data.continuityBag ?? []).map((r) => ({
        parent_application: r.parentApplicationNumber ?? null,
        child_application: r.childApplicationNumber ?? null,
        parent_patent: r.parentPatentNumber ?? null,
        child_patent: r.childPatentNumber ?? null,
        parent_filing_date: r.parentFilingDate ?? null,
        child_filing_date: r.childFilingDate ?? null,
        continuity_type: r.continuityType ?? null,
        claim_type: r.claimType ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                application_number: cleaned,
                relationship_count: relationships.length,
                relationships,
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
