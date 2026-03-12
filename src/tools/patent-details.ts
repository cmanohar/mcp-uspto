/**
 * uspto_patent_details — Get detailed application data from the USPTO Open Data Portal.
 *
 * No API key required. Returns title, abstract, inventors, assignee,
 * classification, and prosecution status for a given application number.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";

interface ApplicationData {
  applicationNumberText?: string;
  inventionTitle?: string;
  inventionAbstractText?: string;
  filingDate?: string;
  patentNumber?: string;
  grantDate?: string;
  applicationStatusCategory?: string;
  applicationStatusDate?: string;
  inventorNameArrayText?: string[];
  assigneeEntityName?: string;
  uspcFullClassificationText?: string;
  cpcClassificationText?: string;
  firstInventorToFileIndicator?: string;
  applicationTypeCategory?: string;
}

export function registerPatentDetails(server: McpServer): void {
  server.tool(
    "uspto_patent_details",
    "Get detailed patent application data — title, abstract, inventors, assignee, classification, status. No API key required.",
    {
      application_number: z
        .string()
        .describe("USPTO application number (e.g. '16123456' or '16/123,456')"),
    },
    async ({ application_number }) => {
      const cleaned = application_number.replace(/[/,\s]/g, "");

      const data = await usptoFetchJson<ApplicationData>(
        `https://data.uspto.gov/api/v1/patent/application/${cleaned}`,
        { apiType: "odp" },
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                application_number: data.applicationNumberText ?? cleaned,
                title: data.inventionTitle ?? null,
                abstract: data.inventionAbstractText ?? null,
                filing_date: data.filingDate ?? null,
                patent_number: data.patentNumber ?? null,
                grant_date: data.grantDate ?? null,
                status: data.applicationStatusCategory ?? null,
                status_date: data.applicationStatusDate ?? null,
                inventors: data.inventorNameArrayText ?? [],
                assignee: data.assigneeEntityName ?? null,
                uspc_classification: data.uspcFullClassificationText ?? null,
                cpc_classification: data.cpcClassificationText ?? null,
                application_type: data.applicationTypeCategory ?? null,
                first_inventor_to_file: data.firstInventorToFileIndicator ?? null,
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
