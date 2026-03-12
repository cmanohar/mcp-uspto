/**
 * Configuration for USPTO API keys.
 *
 * All ODP (Open Data Portal) tools require a free API key from
 * https://data.uspto.gov/apis/getting-started — set USPTO_API_KEY.
 *
 * PatentsView and TSDR have their own keys.
 */

export interface UsptoConfig {
  odpApiKey: string | null;
  patentsviewApiKey: string | null;
  tsdrApiKey: string | null;
}

let cached: UsptoConfig | null = null;

export function getConfig(): UsptoConfig {
  if (cached) return cached;
  cached = {
    odpApiKey: process.env.USPTO_API_KEY ?? null,
    patentsviewApiKey: process.env.USPTO_PATENTSVIEW_API_KEY ?? null,
    tsdrApiKey: process.env.USPTO_TSDR_API_KEY ?? null,
  };
  return cached;
}

/**
 * Returns a structured "key missing" response for key-required tools.
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
          },
          null,
          2,
        ),
      },
    ],
  };
}
