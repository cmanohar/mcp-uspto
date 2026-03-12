/**
 * Configuration for USPTO API keys.
 *
 * All keys are optional — Tier 1 (Open Data Portal) tools work without any key.
 * Tier 2 tools return a helpful setup message when their key is missing.
 */

export interface UsptoConfig {
  patentsviewApiKey: string | null;
  tsdrApiKey: string | null;
  ptabApiKey: string | null;
}

let cached: UsptoConfig | null = null;

export function getConfig(): UsptoConfig {
  if (cached) return cached;
  cached = {
    patentsviewApiKey: process.env.USPTO_PATENTSVIEW_API_KEY ?? null,
    tsdrApiKey: process.env.USPTO_TSDR_API_KEY ?? null,
    ptabApiKey: process.env.USPTO_PTAB_API_KEY ?? null,
  };
  return cached;
}

/**
 * Returns a structured "key missing" response for key-optional tools.
 * This is returned as content (not thrown), so the LLM gets helpful guidance.
 */
export function keyMissingResponse(envVar: string, registrationUrl: string, toolName: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            error: "api_key_required",
            tool: toolName,
            message: `This tool requires an API key. Set the ${envVar} environment variable.`,
            registration: registrationUrl,
            suggestion:
              "For patent searches without an API key, try the uspto_patent_search tool which uses the Open Data Portal (no key required).",
          },
          null,
          2,
        ),
      },
    ],
  };
}
