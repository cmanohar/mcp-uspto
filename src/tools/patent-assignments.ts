/**
 * uspto_patent_assignments — Search patent assignment records.
 *
 * No API key required. Returns ownership transfers, security interests,
 * and other IP transaction records from the USPTO Assignment database.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usptoFetchJson } from "../lib/fetcher.js";

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
    "Search patent ownership transfers and assignments. Find IP acquisitions, security interests, and licensing deals by company name, patent number, or application number. No API key required.",
    {
      query: z
        .string()
        .describe("Search query — company name, patent number, or application number"),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe("Max results to return (default 20, max 50)"),
    },
    async ({ query, limit }) => {
      const params = new URLSearchParams({
        searchText: query,
        rows: String(limit),
      });

      const data = await usptoFetchJson<AssignmentsResponse>(
        `https://data.uspto.gov/api/v1/patent/assignment/search?${params}`,
        { apiType: "odp" },
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
                query,
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
