# MCP Commands Cheatsheet

This file contains all the handy commands for testing and running your MCP servers.

---

## 1. The Easiest Way: Python Server + Inspector (Streamable HTTP)
Use this if you want the easiest way to test your Python `MCP_01` project with HTTP logs. It automatically starts your server and the inspector.

- **Folder to run in:** `w:\The Testing Academy\GenAI10X\MyTestingAcademy\MCP_01`
- **Command:**
  ```powershell
  python start_inspector.py
  ```
- **How to connect in UI:** 
  - Transport Type: `SSE` (or Streamable HTTP)
  - URL: `http://localhost:5001/mcp`
- **To stop:** Press `Ctrl+C` in the terminal.

---

## 2. The Standard Way: Python Server + Inspector (STDIO)
Use this if you want to run your Python `MCP_01` project directly through the inspector without HTTP logs.

- **Folder to run in:** `w:\The Testing Academy\GenAI10X\MyTestingAcademy\MCP_01`
- **Command:**
  ```powershell
  npx @modelcontextprotocol/inspector python stdio_main.py
  ```
- **How to connect in UI:** 
  - Transport Type: `STDIO`
  - Command: `python`
  - Arguments: `stdio_main.py`
  - *(This is usually filled in automatically)*

---

## 3. The Two-Terminal Way (Manual HTTP Setup)
Use this if you want to keep your server running continuously in the background while you restart the inspector multiple times.

- **Folder to run in:** `w:\The Testing Academy\GenAI10X\MyTestingAcademy\MCP_01`

**Terminal 1 (Start the Server):**
```powershell
uvicorn main:app --host 0.0.0.0 --port 5001
```

**Terminal 2 (Start the Inspector):**
```powershell
npx @modelcontextprotocol/inspector
```
- **How to connect in UI:** 
  - Transport Type: `SSE` (or Streamable HTTP)
  - URL: `http://localhost:5001/mcp`

---

## 4. Test External Projects (e.g., Angie Jones Selenium)
Use this to test a completely separate, published MCP server (like the Java/Node Selenium one) without affecting your current project.

- **Folder to run in:** *Anywhere (it doesn't matter, it downloads it temporarily)*
- **Command:**
  ```powershell
  npx @modelcontextprotocol/inspector npx -y @angiejones/mcp-selenium@latest
  ```
- **How to connect in UI:** 
  - Transport Type: `STDIO`
  - Command: `npx`
  - Arguments: `-y @angiejones/mcp-selenium@latest`
  - *(This is usually filled in automatically)*
- **Why run this:** This allows you to interact with a fully built, external Selenium server instantly without writing any code.
