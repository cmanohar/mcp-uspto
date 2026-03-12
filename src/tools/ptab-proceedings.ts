/**
 * uspto_ptab_proceedings — Search PTAB trial proceedings via the Open Data Portal.
 *
 * No API key required. Covers IPR, PGR, CBM, and derivation proceedings.
 * Returns trial metadata, parties, and status.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";

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
    "Search PTAB trial proceedings (IPR, PGR, CBM) — find active and concluded patent challenges with parties, status, and timeline. No API key required.",
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
      const params = new URLSearchParams({ rows: String(limit) });
      if (query) params.set("searchText", query);
      if (patent_number) params.set("patentNumber", patent_number);
      if (party_name) params.set("partyName", party_name);
      if (trial_type) params.set("trialType", trial_type);

      const data = await usptoFetchJson<PtabProceedingsResponse>(
        `https://data.uspto.gov/api/v1/patent/trials/proceedings/search?${params}`,
        { apiType: "odp" },
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
