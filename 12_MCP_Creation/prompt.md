# Prompt & Objective — VWO Test Case MCP Server

> **Folder:** `12_MCP_Creation`  
> **Data source:** `testcases_vwo_100.csv`  
> **Outcome:** `mcp_server.py` + `MCP_CONNECTION.md` + `validate_tools.py`

---

## 1. Original Objective (from the User)

Build a **local MCP (Model Context Protocol) server** using the power of **FastMCP** so that any LLM (Claude, Cline, Cursor, etc.) can connect to it locally and:

1. **Access all test cases** from the provided CSV file.
2. **Search test cases by priority** (P0, P1, P2, P3).
3. **Search test cases by metadata** (module, status, owner, labels, severity, test_type, sprint, etc.).
4. **Add / create new test cases** directly through the MCP.
5. **Update existing test cases**.
6. **Delete test cases**.
7. After building, **open the MCP Inspector** so the user can verify everything is working.
8. **Share the MCP connection information** so the user can connect their LLM client.

The user also asked for:
- **Maximum tools** that are helpful to face the data and everything.
- **Summarization prompts** and any other prompts I think are good.
- A file documenting the prompt and objective.

---

## 2. Data Used

| Field | Description |
|-------|-------------|
| `id` | Test case ID (e.g., `TC-00001`) |
| `jira_id` | Linked JIRA ticket (e.g., `VWO-2989`) |
| `summary` | Short description of the test |
| `module` | Product area (e.g., `AB Testing`, `Reports`, `Goals`) |
| `priority` | P0 / P1 / P2 / P3 |
| `severity` | Blocker / Critical / Major / Minor / Trivial |
| `labels` | Pipe-separated tags (e.g., `regression|smoke|sanity`) |
| `preconditions` | Setup required before testing |
| `steps` | Execution steps |
| `expected_result` | Pass criteria |
| `test_type` | Functional / UI / API / Performance / Security / Integration / Negative / Boundary |
| `owner` | Assigned tester |
| `sprint` | Sprint identifier (e.g., `VWO-25.S38`) |
| `status` | Active / Draft / Archived |

**Total records:** 478 test cases (the CSV contains ~478 rows despite the "100" in the filename).

---

## 3. Exact User Prompts / Requests

### Initial Request
> *"Suppose we have 100 test cases and I want to build a local MCP using power of fast MCP where LLM can connect to MCP and access all the hundred test cases. They can search these test cases by their priority, by their metadata also. I have also added the `testcases_vwo_100.csv` file in the chapter `12_MCP_Creation`. Please work on it, create MCP server so we can connect to it locally. And when you are done, open the MCP inspector so I can see MCP is working or not. Also please share the MCP information so I can connect with. Also I want MCP to append or create new test case there also."*

### Follow-up Request
> *"Add maximum tools which will be helpful to face the data and everything. Also create prompts where I can summarize in them. And whatever prompt you think it's good, add them also."*

### Final Request
> *"Put into Chapter 12, MCP creation, whatever the prompt which I have given you to create this MCP. What was the objective, and which data have we taken, and what is the prompt that we have used? And create `prompt.md`."*

---

## 4. What Was Built

### `mcp_server.py`
A **FastMCP** server using **stdio transport** that loads the entire CSV on startup and exposes:

- **18 Tools** for CRUD + analysis (list, search, filter, count, distribution, export, add, update, delete, compare, duplicate detection, statistics, missing-metadata scan, etc.).
- **8 Prompts** for summarization, coverage analysis, test plan generation, quality audit, owner workload, sprint comparison, and regression/sanity/smoke extraction.
- **Immediate persistence** — `add`, `update`, and `delete` write back to `testcases_vwo_100.csv` instantly and refresh the in-memory cache.

### `MCP_CONNECTION.md`
Ready-to-copy JSON configs for:
- Claude Desktop (`claude_desktop_config.json`)
- Cline / Roo Code (`mcp_settings.json`)
- Cursor (`mcp.json`)

### `validate_tools.py`
A standalone Python script that programmatically calls every tool to verify correctness.

---

## 5. How to Use

**Run the server directly:**
```bash
python mcp_server.py
```

**Test with MCP Inspector:**
```bash
npx @modelcontextprotocol/inspector -- python mcp_server.py
```

**Connect your LLM client** using the JSON snippets in `MCP_CONNECTION.md`.

---

*Generated on: 2026-06-07*  
*Author: User request via OpenCode (kimi-k2.6)*
