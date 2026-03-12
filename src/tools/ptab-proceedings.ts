/**
 * uspto_ptab_proceedings — Search PTAB trial proceedings via the USPTO Open Data Portal.
 *
 * Requires a free API key (set USPTO_API_KEY).
 * Covers IPR, PGR, CBM, and derivation proceedings.
 * Returns trial metadata, parties, and status.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoPostJson } from "../lib/fetcher.js";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface PtabProceeding {
  trialNumber?: string;
  prosecutionStatus?: string;
  filingDate?: string;
  institutionDecisionDate?: string;
  patentOwnerName?: string;
  petitionerPartyName?: string;
  patentNumber?: string;
  inventorName?: string;
  trialType?: string;
  respondentTechnologyCenterNumber?: string;
}

interface PtabProceedingsResponse {
  count?: number;
  results?: PtabProceeding[];
}

export function registerPtabProceedings(server: McpServer): void {
  server.tool(
    "uspto_ptab_proceedings",
    "Search PTAB trial proceedings (IPR, PGR, CBM) — find active and concluded patent challenges with parties, status, and timeline. Requires free API key (set USPTO_API_KEY).",
    {
      query: z
        .string()
        .optional()
        .describe("Search keywords (patent owner, petitioner, etc.)"),
      patent_number: z
        .string()
        .optional()
        .describe("Patent number being challenged"),
      party_name: z
        .string()
        .optional()
        .describe("Name of patent owner or petitioner"),
      trial_type: z
        .enum(["IPR", "PGR", "CBM", "DER"])
        .optional()
        .describe("Type of PTAB proceeding"),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe("Max results (default 20, max 50)"),
    },
    async ({ query, patent_number, party_name, trial_type, limit }) => {
      const config = getConfig();
      if (!config.odpApiKey) {
        return keyMissingResponse(
          "USPTO_API_KEY",
          "https://data.uspto.gov/apis/getting-started",
          "uspto_ptab_proceedings",
        );
      }

      // Build search query string from parameters
      const parts: string[] = [];
      if (query) parts.push(query);
      if (patent_number) parts.push(`patentNumber:${patent_number}`);
      if (party_name) parts.push(`partyName:"${party_name}"`);
      if (trial_type) parts.push(`trialType:${trial_type}`);
      const q = parts.join(" AND ") || "*";

      const data = await usptoPostJson<PtabProceedingsResponse>(
        "https://api.uspto.gov/api/v1/patent-trials/proceedings/search",
        {
          apiType: "odp",
          apiKey: config.odpApiKey,
          apiKeyHeader: "X-API-Key",
          body: {
            q,
            pagination: { offset: 0, limit },
          },
        },
      );

      const proceedings = (data.results ?? []).map((p) => ({
        trial_number: p.trialNumber ?? null,
        trial_type: p.trialType ?? null,
        status: p.prosecutionStatus ?? null,
        patent_number: p.patentNumber ?? null,
        patent_owner: p.patentOwnerName ?? null,
        petitioner: p.petitionerPartyName ?? null,
        filing_date: p.filingDate ?? null,
        institution_date: p.institutionDecisionDate ?? null,
        inventor: p.inventorName ?? null,
        tech_center: p.respondentTechnologyCenterNumber ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                total_count: data.count ?? proceedings.length,
                showing: proceedings.length,
                proceedings,
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
