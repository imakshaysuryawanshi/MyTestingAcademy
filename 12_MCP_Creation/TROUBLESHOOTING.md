# MCP Inspector Troubleshooting Guide

## 🔴 Problem: Browser shows "This site can't be reached" (ERR_CONNECTION_REFUSED)

This means the Inspector's web server is NOT running on `localhost:6274`. Here are the causes and fixes.

---

## ✅ Quick Fixes (Try these first)

### Fix 1: Use the Alternative Inspector (Guaranteed to Work)

We built a lightweight Flask-based web UI that does the same thing as the official Inspector but works reliably on Windows.

**Step 1:** Install Flask (one time only):
```bash
pip install flask
```

**Step 2:** Run the alternative inspector:
```bash
cd "W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation"
python inspector_alt.py
```

**Step 3:** Open your browser to:
```
http://localhost:8080
```

**You will see:**
- A green status badge: "Server is running | 18 Tools | 8 Prompts | 478 Test Cases"
- Clickable buttons for all 18 tools
- Input fields that appear when you select a tool
- A green "Execute Tool" button
- Formatted JSON output

**To stop:** Press `Ctrl+C` in the terminal.

---

### Fix 2: Run the Official Inspector via Batch File

We created a robust batch file that handles all Windows-specific issues:

**Double-click this file:**
```
W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation\start-inspector-diagnostic.bat
```

What it does:
1. Checks Python and Node.js are installed
2. Kills any stuck node processes
3. Checks if ports 6274/6277 are free
4. Starts the Inspector with the correct command
5. Prints the URL you should open

**If browser doesn't open automatically**, manually visit:
```
http://localhost:6274
```

**Important:** Keep the terminal window open! Closing it kills the Inspector.

---

### Fix 3: Connect Your LLM Directly (Skip Inspector Entirely)

The Inspector is only a **testing tool**. Your LLM client (Claude, Cline, Cursor) connects directly to the MCP server via stdio — it doesn't need the Inspector at all.

**Claude Desktop Config:**
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

**Cline / Roo Code Config:**
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

Save → Restart your LLM client → Ask it to "list VWO test cases" and it will work immediately.

---

## 🔍 Diagnostic Steps

If the above fixes don't work, run these checks:

### Check 1: Is Node.js installed?
```bash
node --version
```
Should print something like `v24.14.0`. If not, install Node.js from https://nodejs.org

### Check 2: Is the MCP Inspector installed?
```bash
npm list -g @modelcontextprotocol/inspector
```
Should show version `0.21.2` or similar. If not:
```bash
npm install -g @modelcontextprotocol/inspector
```

### Check 3: Are ports 6274 and 6277 blocked?
Open Command Prompt (not PowerShell) as Administrator:
```cmd
netstat -ano | findstr ":6274"
netstat -ano | findstr ":6277"
```
If you see results, something is already using those ports. Restart your computer or change the Inspector ports (not easily configurable, so use the Alternative Inspector on port 8080 instead).

### Check 4: Windows Firewall / Defender
Temporarily disable Windows Defender Firewall for private networks and try again. If it works, add an inbound rule for Node.js on ports 6274 and 6277.

### Check 5: Browser Proxy Settings
If you use a corporate proxy or VPN, `localhost` might be blocked. Try:
```
http://127.0.0.1:6274
```
Instead of:
```
http://localhost:6274
```

---

## 🧪 Verify the Server Works (No Browser Needed)

Run this command in your terminal:
```bash
cd "W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation"
python test_mcp_client.py
```

**Expected output:**
```
============================================================
VWO MCP SERVER - END-TO-END TEST
============================================================
[1] Initializing session...
     Server name: vwo_testcases
     Server version: 3.3.1
[2] Listing tools...
     Tools found: 18
...
ALL TESTS PASSED - MCP SERVER IS WORKING!
```

If this passes, your server is 100% functional and ready for any LLM client. The Inspector issue is separate and only affects browser-based testing.

---

## 📋 Common Windows-Specific Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `npx` is not recognized | Node.js not in PATH | Reinstall Node.js and check "Add to PATH" |
| `python` not found in npx | Python not in PATH used by Node | Use full Python path in batch file |
| Port already in use | Old Inspector process stuck | `taskkill /F /IM node.exe` |
| Browser won't open | Default browser issue | Manually paste `http://localhost:6274` |
| Page loads but blank | JavaScript disabled | Enable JavaScript in browser |
| ERR_CONNECTION_REFUSED | Inspector crashed | Use Alternative Inspector on port 8080 |
| Powershell execution policy | Script execution blocked | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned` as Admin |

---

## 🎯 Recommended Workflow

1. **Verify server works:** `python test_mcp_client.py`
2. **Test via Alternative Inspector:** `python inspector_alt.py` → open `http://localhost:8080`
3. **Connect your LLM:** Use `mcp-config.json` in Claude/Cline/Cursor
4. **Only if you really need the official Inspector:** Use `start-inspector-diagnostic.bat`

---

## 🆘 Still Not Working?

If none of the above fixes work, the issue is likely a deeper system-level problem with Node.js, your network configuration, or antivirus software. The **Alternative Inspector** (`inspector_alt.py`) bypasses all of these issues entirely and provides the same functionality.

**Just use:**
```bash
python inspector_alt.py
```

And open `http://localhost:8080`. It works every time.

---

*Last updated: 2026-06-07*
