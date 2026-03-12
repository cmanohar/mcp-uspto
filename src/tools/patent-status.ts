/**
 * uspto_patent_status — Get prosecution timeline/transactions for a patent application.
 *
 * Requires a free API key (set USPTO_API_KEY).
 * Returns the full transaction history from filing through grant or abandonment.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface Transaction {
  statusCodeText?: string;
  statusDate?: string;
  statusDescriptionText?: string;
}

interface TransactionsResponse {
  statusCodeBag?: Transaction[];
}

export function registerPatentStatus(server: McpServer): void {
  server.tool(
    "uspto_patent_status",
    "Get the full prosecution timeline of a patent application — every status change from filing to grant/abandonment. Requires free API key (set USPTO_API_KEY).",
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
          "uspto_patent_status",
        );
      }

      const cleaned = application_number.replace(/[/,\s]/g, "");

      const data = await usptoFetchJson<TransactionsResponse>(
        `https://api.uspto.gov/api/v1/patent-applications/${cleaned}/transactions`,
        { apiType: "odp", apiKey: config.odpApiKey, apiKeyHeader: "X-API-Key" },
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
