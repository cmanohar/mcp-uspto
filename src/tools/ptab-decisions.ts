/**
 * uspto_ptab_decisions — Search PTAB trial decisions via the USPTO Open Data Portal.
 *
 * Requires a free API key (set USPTO_API_KEY).
 * Covers Inter Partes Review (IPR), Post-Grant Review (PGR),
 * Covered Business Method (CBM), and derivation proceedings.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoPostJson } from "../lib/fetcher.js";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface PtabDecision {
  trialNumber?: string;
  prosecutionStatus?: string;
  filingDate?: string;
  institutionDecisionDate?: string;
  finalDecisionDate?: string;
  patentOwnerName?: string;
  petitionerPartyName?: string;
  patentNumber?: string;
  inventorName?: string;
  respondentTechnologyCenterNumber?: string;
  trialType?: string;
}

interface PtabResponse {
  count?: number;
  results?: PtabDecision[];
}

export function registerPtabDecisions(server: McpServer): void {
  server.tool(
    "uspto_ptab_decisions",
    "Search Patent Trial and Appeal Board (PTAB) decisions — IPR, PGR, CBM proceedings. Find patent challenges by patent number, party name, or technology area. Requires free API key (set USPTO_API_KEY).",
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
          "uspto_ptab_decisions",
        );
      }

      // Build search query string from parameters
      const parts: string[] = [];
      if (query) parts.push(query);
      if (patent_number) parts.push(`patentNumber:${patent_number}`);
      if (party_name) parts.push(`partyName:"${party_name}"`);
      if (trial_type) parts.push(`trialType:${trial_type}`);
      const q = parts.join(" AND ") || "*";

      const data = await usptoPostJson<PtabResponse>(
        "https://api.uspto.gov/api/v1/patent-trials/decisions/search",
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

      const decisions = (data.results ?? []).map((d) => ({
        trial_number: d.trialNumber ?? null,
        trial_type: d.trialType ?? null,
        status: d.prosecutionStatus ?? null,
        patent_number: d.patentNumber ?? null,
        patent_owner: d.patentOwnerName ?? null,
        petitioner: d.petitionerPartyName ?? null,
        filing_date: d.filingDate ?? null,
        institution_date: d.institutionDecisionDate ?? null,
        final_decision_date: d.finalDecisionDate ?? null,
        inventor: d.inventorName ?? null,
        tech_center: d.respondentTechnologyCenterNumber ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                total_count: data.count ?? decisions.length,
                showing: decisions.length,
                decisions,
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
