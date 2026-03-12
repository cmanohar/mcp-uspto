/**
 * uspto_trademark_status — Look up trademark status via USPTO TSDR.
 *
 * API key optional (free registration at developer.uspto.gov).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig, keyMissingResponse } from "../lib/config.js";
import { usptoFetchJson } from "../lib/fetcher.js";

interface TsdrCaseData {
  serialNumber?: string;
  registrationNumber?: string;
  markIdentification?: string;
  statusCode?: string;
  statusDate?: string;
  filingDate?: string;
  registrationDate?: string;
  ownerName?: string;
  ownerAddress?: string;
  goodsAndServices?: string;
  internationalClassCode?: string[];
  markDrawingCode?: string;
  renewalDate?: string;
  attorneyOfRecord?: string;
}

interface TsdrResponse {
  trademarkStatus?: TsdrCaseData;
}

export function registerTrademarkStatus(server: McpServer): void {
  server.tool(
    "uspto_trademark_status",
    "Look up a trademark's current status, owner, goods/services, and key dates by serial or registration number. Requires API key (set USPTO_TSDR_API_KEY, free at developer.uspto.gov).",
    {
      serial_number: z
        .string()
        .optional()
        .describe("Trademark serial number (e.g. '97123456')"),
      registration_number: z
        .string()
        .optional()
        .describe("Trademark registration number (e.g. '6123456')"),
    },
    async ({ serial_number, registration_number }) => {
      const config = getConfig();
      if (!config.tsdrApiKey) {
        return keyMissingResponse(
          "USPTO_TSDR_API_KEY",
          "https://developer.uspto.gov",
          "uspto_trademark_status",
        );
      }

      if (!serial_number && !registration_number) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "missing_parameter",
                message: "Provide either serial_number or registration_number.",
              }),
            },
          ],
        };
      }

      let url: string;
      if (serial_number) {
        url = `https://tsdrapi.uspto.gov/ts/cd/casestatus/sn${serial_number}/info.json`;
      } else {
        url = `https://tsdrapi.uspto.gov/ts/cd/casestatus/rn${registration_number}/info.json`;
      }

      const data = await usptoFetchJson<TsdrResponse>(url, {
        apiType: "tsdr",
        apiKey: config.tsdrApiKey,
        apiKeyHeader: "USPTO-API-KEY",
      });

      const tm = data.trademarkStatus;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                serial_number: tm?.serialNumber ?? serial_number ?? null,
                registration_number: tm?.registrationNumber ?? registration_number ?? null,
                mark: tm?.markIdentification ?? null,
                status: tm?.statusCode ?? null,
                status_date: tm?.statusDate ?? null,
                filing_date: tm?.filingDate ?? null,
                registration_date: tm?.registrationDate ?? null,
                owner: tm?.ownerName ?? null,
                owner_address: tm?.ownerAddress ?? null,
                goods_and_services: tm?.goodsAndServices ?? null,
                international_classes: tm?.internationalClassCode ?? [],
                mark_type: tm?.markDrawingCode ?? null,
                renewal_date: tm?.renewalDate ?? null,
                attorney: tm?.attorneyOfRecord ?? null,
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
