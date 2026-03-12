# mcp-uspto

MCP server for USPTO — search patents, trademarks, assignments, PTAB decisions, and inventor/assignee data.

**9 tools work with no API key.** 4 more unlock with free registration.

## Quick Start

```json
{
  "mcpServers": {
    "uspto": {
      "command": "npx",
      "args": ["-y", "mcp-uspto"]
    }
  }
}
```

## Tools

### Tier 1: No API Key Required (Open Data Portal)

| Tool | Description |
|------|-------------|
| `uspto_patent_search` | Search patents by keyword — entry point for all patent research |
| `uspto_patent_details` | Title, abstract, inventors, assignee, classification, status |
| `uspto_patent_documents` | List file wrapper docs (office actions, responses, claims) |
| `uspto_patent_assignments` | Ownership transfers, security interests, IP acquisitions |
| `uspto_patent_status` | Full prosecution timeline from filing to grant/abandonment |
| `uspto_patent_continuity` | Patent family tree — continuations, divisionals, CIPs, provisionals |
| `uspto_patent_foreign_priority` | Foreign priority claims — linked international filings |
| `uspto_ptab_decisions` | PTAB trial decisions (IPR, PGR, CBM) |
| `uspto_ptab_proceedings` | PTAB trial proceedings — active and concluded patent challenges |

### Tier 2: Free API Key

| Tool | Env Var | Description |
|------|---------|-------------|
| `uspto_patentsview_search` | `USPTO_PATENTSVIEW_API_KEY` | Rich search with CPC, date, assignee filters |
| `uspto_inventor_search` | `USPTO_PATENTSVIEW_API_KEY` | Find inventors and patent portfolios |
| `uspto_assignee_search` | `USPTO_PATENTSVIEW_API_KEY` | Company IP landscape analysis |
| `uspto_trademark_status` | `USPTO_TSDR_API_KEY` | Trademark status, owner, goods/services |

Tier 2 tools return a helpful setup message (not an error) when the key is missing.

### Getting API Keys

- **PatentsView**: Register free at [patentsview.org](https://patentsview.org/apis/purpose)
- **TSDR**: Register free at [developer.uspto.gov](https://developer.uspto.gov)

### Config with Keys

```json
{
  "mcpServers": {
    "uspto": {
      "command": "npx",
      "args": ["-y", "mcp-uspto"],
      "env": {
        "USPTO_PATENTSVIEW_API_KEY": "your-key-here",
        "USPTO_TSDR_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Example Queries

- "Search for CRISPR gene editing patents" → `uspto_patent_search`
- "Show me the prosecution history for application 16/123,456" → `uspto_patent_status`
- "What's the patent family for this application?" → `uspto_patent_continuity`
- "Does this patent claim foreign priority?" → `uspto_patent_foreign_priority`
- "Find all patent assignments involving Moderna" → `uspto_patent_assignments`
- "Find PTAB challenges against patent 10,234,567" → `uspto_ptab_decisions`
- "What active PTAB proceedings involve Samsung?" → `uspto_ptab_proceedings`
- "What patents does Apple hold in display technology?" → `uspto_assignee_search`
- "Look up trademark serial number 97123456" → `uspto_trademark_status`

## Rate Limits

Built-in token-bucket rate limiting per API tier:
- Open Data Portal: 10 req/sec
- PatentsView: 45 req/min
- TSDR: 60 req/min

## License

MIT
