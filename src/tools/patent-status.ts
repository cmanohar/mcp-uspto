/**
 * uspto_patent_status — Get prosecution timeline for a patent application.
 *
 * No API key required. Returns the full status history from filing
 * through grant or abandonment.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";

interface StatusCode {
  statusCodeText?: string;
  statusDate?: string;
  statusDescriptionText?: string;
}

interface StatusResponse {
  statusCodeBag?: StatusCode[];
}

export function registerPatentStatus(server: McpServer): void {
  server.tool(
    "uspto_patent_status",
    "Get the full prosecution timeline of a patent application — every status change from filing to grant/abandonment. No API key required.",
    {
      application_number: z
        .string()
        .describe("USPTO application number (e.g. '16123456' or '16/123,456')"),
    },
    async ({ application_number }) => {
      const cleaned = application_number.replace(/[/,\s]/g, "");

      const data = await usptoFetchJson<StatusResponse>(
        `https://data.uspto.gov/api/v1/patent/application/${cleaned}/status`,
        { apiType: "odp" },
      );

      const timeline = (data.statusCodeBag ?? []).map((s) => ({
        status: s.statusCodeText ?? null,
        date: s.statusDate ?? null,
        description: s.statusDescriptionText ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                application_number: cleaned,
                timeline_length: timeline.length,
                timeline,
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
