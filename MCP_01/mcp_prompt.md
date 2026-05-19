Act as a senior Python + MCP + DevTools engineer.

Company Name: TheTestingAcademy

Goal:
Create a complete FastMCP-based MCP server project and verify it visually using MCP Inspector.

Main Objective:
The final output MUST successfully connect with MCP Inspector and visibly display:
- 20+ MCP Tools
- 5 MCP Prompts
- 3 MCP Resources
- 2 Data Models/Schemas

IMPORTANT:
The project is considered COMPLETE only if MCP Inspector successfully detects and displays everything.

---------------------------------------------------
TECH STACK
---------------------------------------------------
- Python 3.11+
- FastMCP library
- MCP Inspector
- Uvicorn
- Pydantic
- Async Python

---------------------------------------------------
SERVER CONFIGURATION
---------------------------------------------------
- Backend Port: 5001
- Host: 0.0.0.0
- Transport: stdio + http support
- Use clean modular architecture

Run command:
uvicorn main:app --host 0.0.0.0 --port 5001

---------------------------------------------------
PROJECT STRUCTURE
---------------------------------------------------
project_root/
│
├── main.py
├── server/
├── tools/
├── prompts/
├── resources/
├── models/
├── tests/
├── config/
├── logs/
├── screenshots/
├── requirements.txt
├── README.md
└── .env.example

---------------------------------------------------
MCP TOOLS
---------------------------------------------------
Create 20+ dummy Playwright tools.

Mandatory tool names:
- browser_to_url
- browser_click
- browser_fill
- browser_scroll
- browser_take_screenshot
- browser_wait
- browser_hover
- browser_drag
- browser_press_key
- browser_open_tab
- browser_close_tab
- browser_refresh
- browser_back
- browser_forward
- browser_get_title
- browser_get_text
- browser_select_option
- browser_upload_file
- browser_download_file
- browser_assert_text
- browser_network_logs

Each tool MUST:
- Be registered in FastMCP
- Be visible inside MCP Inspector
- Use docstrings
- Use type hints
- Print:
    print("Started")
- Return:
    return "OK Started"

---------------------------------------------------
RESOURCES
---------------------------------------------------
Create 3 MCP resources:
1. city_config
2. city_test_data
3. city_browser_state

All resources MUST appear inside MCP Inspector.

---------------------------------------------------
DATA MODELS
---------------------------------------------------
Create 2 Pydantic models:
1. CityReport
2. BrowserSessionData

Ensure schemas are exposed and visible.

---------------------------------------------------
PROMPTS
---------------------------------------------------
Create 5 MCP prompts:
1. generate_test_plan
2. playwright_debug_prompt
3. city_navigation_prompt
4. browser_error_analysis
5. automation_strategy_prompt

All prompts MUST appear inside MCP Inspector.

---------------------------------------------------
MCP INSPECTOR REQUIREMENTS
---------------------------------------------------
1. Install MCP Inspector
2. Connect MCP Inspector with the FastMCP server
3. Verify:
   - Tools visible
   - Resources visible
   - Prompts visible
   - Data models visible
4. Capture screenshots of:
   - Connected server
   - Tools tab
   - Resources tab
   - Prompts tab
   - Schema/Data tab

Save screenshots inside:
screenshots/

---------------------------------------------------
DOCUMENTATION
---------------------------------------------------
README.md MUST include:

1. Installation steps
2. Virtual environment setup
3. Dependency installation
4. MCP Inspector installation
5. How to launch Inspector
6. How to connect Inspector to server
7. Expected output screenshots
8. Troubleshooting steps

---------------------------------------------------
MCP INSPECTOR COMMANDS
---------------------------------------------------
Include exact commands such as:

Install:
npm install -g @modelcontextprotocol/inspector

Launch Inspector:
mcp-inspector

Server Run:
uvicorn main:app --host 0.0.0.0 --port 5001

---------------------------------------------------
FINAL OUTPUT REQUIREMENTS
---------------------------------------------------
Generate:
- Complete production-ready code
- Folder structure
- All files with content
- MCP registration code
- Working FastMCP server
- Inspector setup
- Connection instructions
- Screenshot generation steps
- Example screenshots path
- Validation checklist

---------------------------------------------------
SUCCESS CRITERIA
---------------------------------------------------
The task is COMPLETE only when:
✓ MCP Inspector connects successfully
✓ 20+ tools visible
✓ 3 resources visible
✓ 2 schemas/models visible
✓ 5 prompts visible
✓ Screenshots captured successfully
✓ Server runs on port 5001
✓ No placeholder TODOs remain