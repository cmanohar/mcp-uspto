/**
 * uspto_ptab_decisions — Search PTAB trial decisions.
 *
 * API key optional (free registration at developer.uspto.gov).
 * Covers Inter Partes Review (IPR), Post-Grant Review (PGR),
 * Covered Business Method (CBM), and derivation proceedings.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig, keyMissingResponse } from "../lib/config.js";
import { usptoFetchJson } from "../lib/fetcher.js";

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
  results?: PtabDecision[];
  recordTotalQuantity?: number;
}

export function registerPtabDecisions(server: McpServer): void {
  server.tool(
    "uspto_ptab_decisions",
    "Search Patent Trial and Appeal Board (PTAB) decisions — IPR, PGR, CBM proceedings. Find patent challenges by patent number, party name, or technology area. Requires API key (set USPTO_PTAB_API_KEY, free at developer.uspto.gov).",
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
      if (!config.ptabApiKey) {
        return keyMissingResponse(
          "USPTO_PTAB_API_KEY",
          "https://developer.uspto.gov",
          "uspto_ptab_decisions",
        );
      }

      const params = new URLSearchParams({ limit: String(limit) });
      if (query) params.set("searchText", query);
      if (patent_number) params.set("patentNumber", patent_number);
      if (party_name) params.set("partyName", party_name);
      if (trial_type) params.set("trialType", trial_type);

      const data = await usptoFetchJson<PtabResponse>(
        `https://developer.uspto.gov/ptab-api/v3/trials?${params}`,
        {
          apiType: "ptab",
          apiKey: config.ptabApiKey,
          apiKeyHeader: "X-Api-Key",
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
                total_count: data.recordTotalQuantity ?? decisions.length,
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
