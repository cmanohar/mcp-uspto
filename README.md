# mcp-uspto

MCP server for USPTO — search patents, trademarks, assignments, PTAB decisions, and inventor/assignee data.

**13 tools.** All require free API keys (no paid tiers).

## Quick Start

1. Get a free API key at [data.uspto.gov/apis/getting-started](https://data.uspto.gov/apis/getting-started)
2. Add to your MCP config:

```json
{
  "mcpServers": {
    "uspto": {
      "command": "npx",
      "args": ["-y", "mcp-uspto"],
      "env": {
        "USPTO_API_KEY": "your-odp-key-here"
      }
    }
  }
}
```

This unlocks 9 tools. For all 13, add the optional keys below.

## Tools

### Open Data Portal (USPTO_API_KEY)

| Tool | Description |
|------|-------------|
| `uspto_patent_search` | Search patents by keyword — entry point for all patent research |
| `uspto_patent_details` | Title, abstract, inventors, assignee, classification, status |
| `uspto_patent_documents` | List file wrapper docs (office actions, responses, claims) |
| `uspto_patent_assignments` | Ownership transfers, security interests for an application |
| `uspto_patent_status` | Full prosecution timeline from filing to grant/abandonment |
| `uspto_patent_continuity` | Patent family tree — continuations, divisionals, CIPs, provisionals |
| `uspto_patent_foreign_priority` | Foreign priority claims — linked international filings |
| `uspto_ptab_decisions` | PTAB trial decisions (IPR, PGR, CBM) |
| `uspto_ptab_proceedings` | PTAB trial proceedings — active and concluded patent challenges |

### PatentsView (USPTO_PATENTSVIEW_API_KEY)

| Tool | Description |
|------|-------------|
| `uspto_patentsview_search` | Rich search with CPC, date, assignee filters |
| `uspto_inventor_search` | Find inventors and patent portfolios |
| `uspto_assignee_search` | Company IP landscape analysis |

Register free at [patentsview.org](https://patentsview.org/apis/purpose)

### TSDR (USPTO_TSDR_API_KEY)

| Tool | Description |
|------|-------------|
| `uspto_trademark_status` | Trademark status, owner, goods/services |

Register free at [developer.uspto.gov](https://developer.uspto.gov)

### Full Config (all keys)

```json
{
  "mcpServers": {
    "uspto": {
      "command": "npx",
      "args": ["-y", "mcp-uspto"],
      "env": {
        "USPTO_API_KEY": "your-odp-key",
        "USPTO_PATENTSVIEW_API_KEY": "your-patentsview-key",
        "USPTO_TSDR_API_KEY": "your-tsdr-key"
      }
    }
  }
}
```

Tools return a helpful setup message (not an error) when their key is missing.

## Example Queries

- "Search for CRISPR gene editing patents" → `uspto_patent_search`
- "Show me the prosecution history for application 16/123,456" → `uspto_patent_status`
- "What's the patent family for this application?" → `uspto_patent_continuity`
- "Does this patent claim foreign priority?" → `uspto_patent_foreign_priority`
- "Get assignment records for application 16/123,456" → `uspto_patent_assignments`
- "Find PTAB challenges against patent 10,234,567" → `uspto_ptab_decisions`
- "What active PTAB proceedings involve Samsung?" → `uspto_ptab_proceedings`
- "What patents does Apple hold in display technology?" → `uspto_assignee_search`
- "Look up trademark serial number 97123456" → `uspto_trademark_status`

## Rate Limits

Built-in token-bucket rate limiting per API:
- Open Data Portal: 10 req/sec
- PatentsView: 45 req/min
- TSDR: 60 req/min

## License

MIT
