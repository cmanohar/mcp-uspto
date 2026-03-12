/**
 * uspto_patent_documents — List file wrapper documents from the USPTO Open Data Portal.
 *
 * No API key required. Returns office actions, responses, claims,
 * and other prosecution documents for an application.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";

interface Document {
  documentIdentifier?: string;
  documentCodeDescriptionText?: string;
  officialDate?: string;
  directionCategory?: string;
  pageCount?: number;
}

interface DocumentsResponse {
  documentBag?: Document[];
}

export function registerPatentDocuments(server: McpServer): void {
  server.tool(
    "uspto_patent_documents",
    "List file wrapper documents (office actions, responses, claims) for a patent application. No API key required.",
    {
      application_number: z
        .string()
        .describe("USPTO application number (e.g. '16123456' or '16/123,456')"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Max documents to return (default 25, max 100)"),
    },
    async ({ application_number, limit }) => {
      const cleaned = application_number.replace(/[/,\s]/g, "");

      const data = await usptoFetchJson<DocumentsResponse>(
        `https://data.uspto.gov/api/v1/patent/application/${cleaned}/documents`,
        { apiType: "odp" },
      );

      const docs = (data.documentBag ?? []).slice(0, limit).map((d) => ({
        document_id: d.documentIdentifier ?? null,
        description: d.documentCodeDescriptionText ?? null,
        date: d.officialDate ?? null,
        direction: d.directionCategory ?? null,
        page_count: d.pageCount ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                application_number: cleaned,
                total_documents: (data.documentBag ?? []).length,
                showing: docs.length,
                documents: docs,
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
