# TheTestingAcademy MCP Server

This is a complete FastMCP-based MCP server project that implements tools, resources, and prompts for testing automation.

## Project Structure
```
project_root/
├── main.py
├── server/
│   └── mcp_server.py
├── tools/
│   └── playwright_tools.py
├── prompts/
│   └── prompts.py
├── resources/
│   └── resources.py
├── models/
│   └── schemas.py
├── screenshots/
├── requirements.txt
├── README.md
└── .env.example
```

## Installation Steps

1. **Virtual Environment Setup**:
   Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

2. **Dependency Installation**:
   Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. **MCP Inspector Installation**:
   Install the MCP inspector globally via npm:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

## Running the Server & Inspector

### 1. Launch Inspector

Launch the MCP inspector using npx (or the installed command):
```bash
npx @modelcontextprotocol/inspector uvicorn main:app --host 0.0.0.0 --port 5001
```
Alternatively, if you're running the inspector separately:
```bash
mcp-inspector
```

### 2. Connect Inspector to Server

The Inspector typically runs on `http://localhost:5173`. Open it in your browser.
Configure the connection to use `uvicorn main:app --host 0.0.0.0 --port 5001`.

### 3. Server Run Command

If you want to run the server standalone without the inspector:
```bash
uvicorn main:app --host 0.0.0.0 --port 5001
```

## Expected Output Screenshots
Verify that:
- 21 tools are visible
- 3 resources are visible
- 5 prompts are visible
- Schemas are loaded

Save screenshots in the `screenshots/` directory.

## Troubleshooting Steps
- Make sure you are using Python 3.11+.
- If `uvicorn` fails to find `main:app`, ensure you are in the root directory where `main.py` is located.
- Check port availability for 5001.
