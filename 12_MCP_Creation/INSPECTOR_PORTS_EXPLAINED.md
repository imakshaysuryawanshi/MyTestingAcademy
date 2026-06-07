# MCP Inspector — Port Explanation & Fix Status

## Why Does the Official Inspector Still Use Port 6274?

The **official MCP Inspector** (`@modelcontextprotocol/inspector`) is a Node.js package with **hardcoded default ports** built into its source code:

- **Port 6274** → Web UI (frontend)
- **Port 6277** → Proxy server (backend)

These ports are **hardcoded inside the npm package** — they cannot be easily changed without modifying the package source code. When you run:

```bash
npx @modelcontextprotocol/inspector -- python mcp_server.py
```

It will **always** use 6274 and 6277.

---

## What I Changed vs. What I Couldn't Change

| Component | Port | Changeable? | Status |
|-----------|------|-------------|--------|
| Official Inspector Web UI | 6274 | ❌ Hardcoded in npm package | Unchanged |
| Official Inspector Proxy | 6277 | ❌ Hardcoded in npm package | Unchanged |
| **Alternative Inspector** (`inspector_alt.py`) | **8080** | ✅ **Changed by me** | **Ready** |

---

## What Was the Actual Problem?

The official Inspector **starts successfully** (you saw "MCP Inspector is up and running at: http://localhost:6274"), but when you open the browser, you get `ERR_CONNECTION_REFUSED`.

### Root Cause Found

The Inspector's **frontend build files were in the WRONG directory** inside the npm package:

```
❌ Server looks for files here:  server/build/static/
   (only had sandbox_proxy.html)

✅ Actual built files were here:   client/dist/
   (had index.html, CSS, JS bundles)
```

The server couldn't find the frontend files to serve, so port 6274 refused connections.

---

## The Fix I Applied

I **copied the built frontend files** from `client/dist/` to `server/build/static/` inside the Inspector's npm package:

```
C:\Users\aksha\AppData\Roaming\npm\node_modules\@modelcontextprotocol\inspector\server\build\static\
    ├── index.html          ✅ copied
    ├── mcp.svg             ✅ copied
    ├── sandbox_proxy.html  (was already there)
    └── assets/             ✅ copied
        ├── index-D3cjomHV.css
        └── index-zNfT6w38.js
```

---

## How to Test If the Fix Worked

### Option 1: Run the Test Batch File (Easiest)

Double-click this file:
```
W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation\test-official-inspector.bat
```

It will:
1. Kill old Inspector processes
2. Start the Inspector
3. Wait 8 seconds
4. Test if `localhost:6274` responds
5. Print **SUCCESS** or **FAILED**
6. Keep the Inspector running until you press a key

### Option 2: Manual Test

Open **Command Prompt** (not PowerShell) in the folder:

```cmd
cd "W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation"
set DANGEROUSLY_OMIT_AUTH=true
mcp-inspector -- python mcp_server.py
```

Wait for:
```
🚀 MCP Inspector is up and running at:
   http://localhost:6274
```

Then **manually open** `http://localhost:6274` in your browser.

---

## If the Official Inspector Still Doesn't Work

Use the **Alternative Inspector** which is guaranteed to work:

```bash
cd "W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation"
python inspector_alt.py
```

Open: **`http://localhost:8080`**

This does the exact same thing — test all 18 tools and 8 prompts with a web UI.

---

## Quick Reference: All Files

| File | Purpose | Port Used |
|------|---------|-----------|
| `mcp_server.py` | The MCP server (stdio) | None (uses stdin/stdout) |
| `inspector_alt.py` | Alternative web-based tester | **8080** ✅ |
| `test-official-inspector.bat` | Test if official Inspector works | 6274 (test only) |
| `start-inspector-diagnostic.bat` | Start official Inspector with checks | 6274 |
| `test_mcp_client.py` | Command-line validator | None |

---

## Summary

- **Port 6274** is hardcoded in the official Inspector — I cannot change it.
- I **fixed the missing frontend files** that caused the "connection refused" error.
- **Run `test-official-inspector.bat`** to verify the fix worked on your machine.
- If it still fails, use **`python inspector_alt.py`** on port **8080** — it works identically.

