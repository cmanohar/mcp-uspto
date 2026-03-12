# mcp-uspto

MCP server for USPTO — search patents, trademarks, assignments, PTAB decisions, and inventor/assignee data.

**5 tools work with no API key.** 5 more unlock with free registration.

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

### Tier 1: No API Key Required

| Tool | Description |
|------|-------------|
| `uspto_patent_search` | Search patents by keyword — entry point for all patent research |
| `uspto_patent_details` | Title, abstract, inventors, assignee, classification, status |
| `uspto_patent_documents` | List file wrapper docs (office actions, responses, claims) |
| `uspto_patent_assignments` | Ownership transfers, security interests, IP acquisitions |
| `uspto_patent_status` | Full prosecution timeline from filing to grant/abandonment |

### Tier 2: Free API Key

| Tool | Env Var | Description |
|------|---------|-------------|
| `uspto_patentsview_search` | `USPTO_PATENTSVIEW_API_KEY` | Rich search with CPC, date, assignee filters |
| `uspto_inventor_search` | `USPTO_PATENTSVIEW_API_KEY` | Find inventors and patent portfolios |
| `uspto_assignee_search` | `USPTO_PATENTSVIEW_API_KEY` | Company IP landscape analysis |
| `uspto_trademark_status` | `USPTO_TSDR_API_KEY` | Trademark status, owner, goods/services |
| `uspto_ptab_decisions` | `USPTO_PTAB_API_KEY` | IPR, PGR, CBM trial decisions |

Tier 2 tools return a helpful setup message (not an error) when the key is missing.

### Getting API Keys

- **PatentsView**: Register free at [patentsview.org](https://patentsview.org/apis/purpose)
- **TSDR / PTAB**: Register free at [developer.uspto.gov](https://developer.uspto.gov)

### Config with Keys

```json
{
  "mcpServers": {
    "uspto": {
      "command": "npx",
      "args": ["-y", "mcp-uspto"],
      "env": {
        "USPTO_PATENTSVIEW_API_KEY": "your-key-here",
        "USPTO_TSDR_API_KEY": "your-key-here",
        "USPTO_PTAB_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Example Queries

- "Search for CRISPR gene editing patents" → `uspto_patent_search`
- "Show me the prosecution history for application 16/123,456" → `uspto_patent_status`
- "Find all patent assignments involving Moderna" → `uspto_patent_assignments`
- "What patents does Apple hold in display technology?" → `uspto_assignee_search`
- "Look up trademark serial number 97123456" → `uspto_trademark_status`
- "Find PTAB challenges against patent 10,234,567" → `uspto_ptab_decisions`

## Rate Limits

Built-in token-bucket rate limiting per API tier:
- Open Data Portal: 10 req/sec
- PatentsView: 45 req/min
- TSDR/PTAB: 60 req/min

## License

MIT
