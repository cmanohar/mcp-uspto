/**
 * uspto_assignee_search — Find patent assignees (companies) via PatentsView API.
 *
 * API key optional (free registration).
 *
 * NOTE: PatentsView is migrating to ODP by ~March 20, 2026.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig, keyMissingResponse } from "../lib/config.js";

interface Assignee {
  assignee_id?: string;
  assignee_organization?: string;
  assignee_first_name?: string;
  assignee_last_name?: string;
  assignee_total_num_patents?: number;
  assignee_type?: string;
  assignee_lastknown_city?: string;
  assignee_lastknown_state?: string;
  assignee_lastknown_country?: string;
}

interface AssigneeResponse {
  assignees?: Assignee[];
  count?: number;
  total_assignee_count?: number;
}

export function registerAssigneeSearch(server: McpServer): void {
  server.tool(
    "uspto_assignee_search",
    "Find companies/organizations and their patent portfolios via PatentsView. Useful for competitive intelligence and IP landscape analysis. Requires free API key (set USPTO_PATENTSVIEW_API_KEY).",
    {
      organization: z
        .string()
        .describe("Company/organization name to search for"),
      per_page: z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Results per page (default 25)"),
    },
    async ({ organization, per_page }) => {
      const config = getConfig();
      if (!config.patentsviewApiKey) {
        return keyMissingResponse(
          "USPTO_PATENTSVIEW_API_KEY",
          "https://patentsview.org/apis/purpose",
          "uspto_assignee_search",
        );
      }

      const body = {
        q: { _text_any: { assignee_organization: organization } },
        f: [
          "assignee_id",
          "assignee_organization",
          "assignee_first_name",
          "assignee_last_name",
          "assignee_total_num_patents",
          "assignee_type",
          "assignee_lastknown_city",
          "assignee_lastknown_state",
          "assignee_lastknown_country",
        ],
        o: { per_page },
        s: [{ assignee_total_num_patents: "desc" }],
      };

      const res = await fetch("https://api.patentsview.org/assignees/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": config.patentsviewApiKey,
          "User-Agent": "mcp-uspto/0.1.2",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`PatentsView API error: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as AssigneeResponse;

      const assignees = (data.assignees ?? []).map((a) => ({
        assignee_id: a.assignee_id ?? null,
        organization: a.assignee_organization ?? null,
        individual_name:
          a.assignee_first_name || a.assignee_last_name
            ? `${a.assignee_first_name ?? ""} ${a.assignee_last_name ?? ""}`.trim()
            : null,
        total_patents: a.assignee_total_num_patents ?? null,
        type: a.assignee_type ?? null,
        city: a.assignee_lastknown_city ?? null,
        state: a.assignee_lastknown_state ?? null,
        country: a.assignee_lastknown_country ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                query: organization,
                total_count: data.total_assignee_count ?? assignees.length,
                showing: assignees.length,
                assignees,
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
