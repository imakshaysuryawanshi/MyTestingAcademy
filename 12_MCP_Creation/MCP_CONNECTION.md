# VWO Test Case MCP — Connection Guide

> **Server file:** `mcp_server.py`  
> **Data file:** `testcases_vwo_100.csv`  
> **Transport:** stdio  
> **Framework:** FastMCP (Python)

---

## Quick Start

1. **Ensure Python dependencies are installed:**
   ```bash
   pip install fastmcp uvicorn pydantic
   ```

2. **Verify the server starts:**
   ```bash
   python mcp_server.py
   ```
   *(It should appear to hang — that is correct; stdio transport waits for JSON-RPC messages from the MCP client.)*

3. **Connect your LLM client** using one of the configs below.

---

## MCP Inspector (Testing)

Test tools interactively via the Alternative Inspector (the official Inspector has issues on Windows):

```bash
cd "W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation"
pip install flask
python inspector_alt.py
```

Open **`http://localhost:8080`** in your browser to browse and call every tool.

---

## Client Configurations

### Claude Desktop

Edit your Claude Desktop config file:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add this inside the `"mcpServers"` object:

```json
{
  "mcpServers": {
    "vwo_testcases": {
      "command": "python",
      "args": [
        "W:\\The Testing Academy\\GenAI10X\\MyTestingAcademy\\12_MCP_Creation\\mcp_server.py"
      ]
    }
  }
}
```

> **Restart Claude Desktop** after saving.

---

### Cline / Roo Code (VS Code extension)

Add to your `mcp_settings.json` (usually found via the extension settings → "MCP Servers"):

```json
{
  "mcpServers": [
    {
      "name": "vwo_testcases",
      "command": "python",
      "args": [
        "W:\\The Testing Academy\\GenAI10X\\MyTestingAcademy\\12_MCP_Creation\\mcp_server.py"
      ],
      "transport": "stdio"
    }
  ]
}
```

> Reload the Cline/Roo Code window or restart the MCP server from the UI.

---

### Cursor

Add to Cursor's MCP config (Settings → MCP → Add Server → Command):

```json
{
  "mcpServers": [
    {
      "name": "vwo_testcases",
      "command": "python",
      "args": [
        "W:\\The Testing Academy\\GenAI10X\\MyTestingAcademy\\12_MCP_Creation\\mcp_server.py"
      ],
      "transport": "stdio"
    }
  ]
}
```

> Restart Cursor after adding.

---

## Available Tools (18)

| # | Tool | What it does |
|---|------|-------------|
| 1 | `get_testcase(id)` | Fetch one test case by exact ID |
| 2 | `list_testcases(...)` | Filtered, paginated list |
| 3 | `search_testcases(query)` | Full-text search across summary, steps, expected_result, preconditions |
| 4 | `get_metadata(field)` | Discover unique values for any column |
| 5 | `get_testcase_count(...)` | Count matching records |
| 6 | `get_distribution(field)` | Breakdown counts by field value |
| 7 | `get_testcases_by_sprint(sprint)` | All cases in a sprint |
| 8 | `get_testcases_by_label(label)` | All cases with a label |
| 9 | `get_testcases_by_jira(jira_id)` | Find by JIRA ticket |
| 10 | `compare_testcases(id1, id2)` | Side-by-side diff |
| 11 | `find_missing_metadata()` | Cases with empty critical fields |
| 12 | `get_recent_testcases(n)` | Last n cases by ID |
| 13 | `export_testcases(format, ...)` | Export as JSON or CSV string |
| 14 | `add_testcase(...)` | Append a new case (auto ID, persisted) |
| 15 | `update_testcase(id, ...)` | Modify fields of an existing case (persisted) |
| 16 | `delete_testcase(id)` | Remove a case (persisted) |
| 17 | `get_statistics()` | Overall repo stats |
| 18 | `find_duplicate_summaries(threshold)` | Detect near-duplicate summaries |

## Available Prompts (8)

| Prompt | Purpose |
|--------|---------|
| `summarize_module(module)` | Summarize all cases for one module |
| `summarize_priority(priority)` | Summarize cases by P0/P1/P2/P3 |
| `analyze_coverage()` | Full coverage-gap analysis |
| `generate_test_plan(sprint)` | Execution plan for a sprint |
| `audit_test_quality()` | Quality audit with health score |
| `summarize_owner_workload(owner)` | Workload summary per person |
| `compare_sprints(s1, s2)` | Side-by-side sprint comparison |
| `find_regression_sanity_smoke()` | Extract regression / sanity / smoke suites |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "command not found: python" | Use the full path to your Python executable, e.g. `C:\Users\<you>\AppData\Local\Programs\Python\Python312\python.exe` |
| "fastmcp not found" | Run `pip install fastmcp uvicorn pydantic` |
| Inspector shows no tools | Check that `mcp_server.py` is in the same folder as `testcases_vwo_100.csv` |
| CSV not found | Ensure `testcases_vwo_100.csv` exists in `12_MCP_Creation` |
