/**
 * uspto_patent_assignments — Get assignment data for a patent application.
 *
 * Requires a free API key (set USPTO_API_KEY).
 * Returns ownership transfers, security interests, and other IP transaction records.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface Assignment {
  assignorName?: string;
  assigneeName?: string;
  correspondenceName?: string;
  executionDate?: string;
  recordedDate?: string;
  conveyanceText?: string;
  reelNumber?: string;
  frameNumber?: string;
  patentNumber?: string;
  applicationNumber?: string;
}

interface AssignmentsResponse {
  count?: number;
  assignments?: Assignment[];
}

export function registerPatentAssignments(server: McpServer): void {
  server.tool(
    "uspto_patent_assignments",
    "Get patent ownership transfers and assignments for a specific application. Find IP acquisitions, security interests, and licensing deals. Requires free API key (set USPTO_API_KEY).",
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
          "uspto_patent_assignments",
        );
      }

      const cleaned = application_number.replace(/[/,\s]/g, "");

      const data = await usptoFetchJson<AssignmentsResponse>(
        `https://api.uspto.gov/api/v1/patent-applications/${cleaned}/assignment`,
        { apiType: "odp", apiKey: config.odpApiKey, apiKeyHeader: "X-API-Key" },
      );

      const assignments = (data.assignments ?? []).map((a) => ({
        assignor: a.assignorName ?? null,
        assignee: a.assigneeName ?? null,
        execution_date: a.executionDate ?? null,
        recorded_date: a.recordedDate ?? null,
        conveyance: a.conveyanceText ?? null,
        reel_frame: a.reelNumber && a.frameNumber
          ? `${a.reelNumber}/${a.frameNumber}`
          : null,
        patent_number: a.patentNumber ?? null,
        application_number: a.applicationNumber ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                application_number: cleaned,
                total_count: data.count ?? assignments.length,
                results: assignments,
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
