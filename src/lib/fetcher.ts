/**
 * Rate-limited HTTP fetcher for USPTO APIs.
 *
 * Multiple token buckets for different API tiers:
 * - ODP (Open Data Portal): 10 req/sec (conservative default)
 * - PatentsView: 45 req/min (~0.75/sec)
 * - TSDR/PTAB: 60 req/min (~1/sec)
 */

const DEFAULT_USER_AGENT =
  "mcp-uspto/0.1.2 (https://github.com/cmanohar/mcp-uspto)";

const userAgent = process.env.USPTO_USER_AGENT ?? DEFAULT_USER_AGENT;

export type ApiType = "odp" | "patentsview" | "tsdr";

interface Bucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per second
  lastRefill: number;
}

const buckets: Record<ApiType, Bucket> = {
  odp: { tokens: 10, maxTokens: 10, refillRate: 10, lastRefill: Date.now() },
  patentsview: { tokens: 3, maxTokens: 3, refillRate: 0.75, lastRefill: Date.now() },
  tsdr: { tokens: 5, maxTokens: 5, refillRate: 1, lastRefill: Date.now() },
};

function refillTokens(bucket: Bucket): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    bucket.tokens = Math.min(
      bucket.maxTokens,
      bucket.tokens + (elapsed / 1000) * bucket.refillRate,
    );
    bucket.lastRefill = now;
  }
}

async function waitForToken(apiType: ApiType): Promise<void> {
  const bucket = buckets[apiType];
  refillTokens(bucket);
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return;
  }
  const waitMs = ((1 - bucket.tokens) / bucket.refillRate) * 1000;
  await new Promise((resolve) => setTimeout(resolve, Math.ceil(waitMs)));
  refillTokens(bucket);
  bucket.tokens -= 1;
}

export interface FetchOptions {
  apiType?: ApiType;
  apiKey?: string | null;
  apiKeyHeader?: string;
}

/**
 * Fetch a URL from USPTO APIs with rate limiting and optional API key.
 */
export async function usptoFetch(
  url: string,
  opts: FetchOptions = {},
): Promise<Response> {
  const apiType = opts.apiType ?? "odp";
  await waitForToken(apiType);

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "application/json",
  };

  if (opts.apiKey) {
    headers[opts.apiKeyHeader ?? "X-Api-Key"] = opts.apiKey;
  }

  return fetch(url, { headers });
}

/**
 * Fetch and return JSON, throwing on HTTP errors.
 */
export async function usptoFetchJson<T = unknown>(
  url: string,
  opts: FetchOptions = {},
): Promise<T> {
  const res = await usptoFetch(url, opts);
  if (!res.ok) {
    throw new Error(`USPTO API error: ${res.status} ${res.statusText} — ${url}`);
  }
  return (await res.json()) as T;
}

export interface PostJsonOptions extends FetchOptions {
  /** JSON-serializable body to send as POST */
  body: unknown;
}

/**
 * POST JSON to a USPTO API endpoint with rate limiting and optional API key.
 * Returns parsed JSON, throwing on HTTP errors.
 */
export async function usptoPostJson<T = unknown>(
  url: string,
  opts: PostJsonOptions,
): Promise<T> {
  const apiType = opts.apiType ?? "odp";
  await waitForToken(apiType);

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (opts.apiKey) {
    headers[opts.apiKeyHeader ?? "X-Api-Key"] = opts.apiKey;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body),
  });

  if (!res.ok) {
    throw new Error(`USPTO API error: ${res.status} ${res.statusText} — ${url}`);
  }
  return (await res.json()) as T;
}
