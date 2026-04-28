/**
 * API smoke test for all 9 ODP endpoints.
 *
 * Usage:
 *   USPTO_API_KEY=your-key npm run test:api
 */

import { usptoFetchJson, usptoPostJson } from "../src/lib/fetcher.js";
import { getConfig } from "../src/lib/config.js";

// ANSI colors
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const PASS = `${GREEN}PASS${RESET}`;
const FAIL = `${RED}FAIL${RESET}`;
const SKIP = `${DIM}SKIP${RESET}`;

let failures = 0;

function summary(obj: unknown): string {
  const s = JSON.stringify(obj);
  return s.length > 120 ? s.slice(0, 120) + "..." : s;
}

async function test(
  name: string,
  fn: () => Promise<{ status: string; detail: string }>,
): Promise<{ status: string; detail: string } | null> {
  process.stdout.write(`  ${BOLD}${name}${RESET} ... `);
  try {
    const result = await fn();
    console.log(`${PASS}  ${DIM}${result.detail}${RESET}`);
    return result;
  } catch (err: unknown) {
    failures++;
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${FAIL}  ${RED}${msg}${RESET}`);
    return null;
  }
}

function skip(name: string, reason: string): void {
  console.log(`  ${BOLD}${name}${RESET} ... ${SKIP}  ${DIM}${reason}${RESET}`);
}

// ---------------------------------------------------------------------------

async function main() {
  const config = getConfig();
  if (!config.odpApiKey) {
    console.error(
      `${RED}Error: USPTO_API_KEY environment variable is not set.${RESET}\n` +
        `Get a free key at https://data.uspto.gov/apis/getting-started`,
    );
    process.exit(1);
  }

  const apiKey = config.odpApiKey;
  const base = "https://api.uspto.gov/api/v1";
  const opts = { apiType: "odp" as const, apiKey, apiKeyHeader: "X-API-Key" };

  console.log(`\n${BOLD}USPTO ODP API Smoke Tests${RESET}\n`);

  // --- Test 1: Patent Search (POST) ---
  let appNum: string | null = null;

  const searchResult = await test("1. patent_search (POST /patent-applications/search)", async () => {
    const data = await usptoPostJson<{ count?: number; patentFileWrapperSearchResults?: Array<{ applicationNumberText?: string; inventionTitle?: string }> }>(
      `${base}/patent-applications/search`,
      { ...opts, body: { q: "artificial intelligence", pagination: { offset: 0, limit: 3 } } },
    );
    const results = data.patentFileWrapperSearchResults ?? [];
    if (results.length === 0) throw new Error("No results returned");
    appNum = (results[0].applicationNumberText ?? "").replace(/[/,\s]/g, "");
    return { status: "pass", detail: `count=${data.count}, appNum=${appNum}, title="${results[0].inventionTitle}"` };
  });

  // --- Tests 2-7: Detail endpoints (GET, depend on appNum) ---
  const detailEndpoints = [
    { num: 2, name: "patent_details", path: "" },
    { num: 3, name: "patent_documents", path: "/documents" },
    { num: 4, name: "patent_assignments", path: "/assignment" },
    { num: 5, name: "patent_status", path: "/transactions" },
    { num: 6, name: "patent_continuity", path: "/continuity" },
    { num: 7, name: "patent_foreign_priority", path: "/foreign-priority" },
  ];

  for (const ep of detailEndpoints) {
    if (!appNum) {
      skip(`${ep.num}. ${ep.name} (GET .../${ep.path || "{appNum}"})`, "skipped — no appNum from test 1");
      continue;
    }
    const url = `${base}/patent-applications/${appNum}${ep.path}`;
    await test(`${ep.num}. ${ep.name} (GET /patent-applications/{appNum}${ep.path})`, async () => {
      const data = await usptoFetchJson<unknown>(url, opts);
      return { status: "pass", detail: summary(data) };
    });
  }

  // --- Test 8: PTAB Decisions (POST, independent) ---
  await test("8. ptab_decisions (POST /patent-trials/decisions/search)", async () => {
    const data = await usptoPostJson<{ count?: number; results?: unknown[] }>(
      `${base}/patent-trials/decisions/search`,
      { ...opts, body: { q: "*", pagination: { offset: 0, limit: 3 } } },
    );
    const count = data.count ?? 0;
    const showing = (data.results ?? []).length;
    return { status: "pass", detail: `count=${count}, showing=${showing}` };
  });

  // --- Test 9: PTAB Proceedings (POST, independent) ---
  await test("9. ptab_proceedings (POST /patent-trials/proceedings/search)", async () => {
    const data = await usptoPostJson<{ count?: number; results?: unknown[] }>(
      `${base}/patent-trials/proceedings/search`,
      { ...opts, body: { q: "*", pagination: { offset: 0, limit: 3 } } },
    );
    const count = data.count ?? 0;
    const showing = (data.results ?? []).length;
    return { status: "pass", detail: `count=${count}, showing=${showing}` };
  });

  // --- Summary ---
  console.log("");
  if (failures === 0) {
    console.log(`${GREEN}${BOLD}All 9 tests passed.${RESET}\n`);
  } else {
    console.log(`${RED}${BOLD}${failures} test(s) failed.${RESET}\n`);
    process.exit(1);
  }
}

main();
