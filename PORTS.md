# 🚦 GenAI10X Port Registry
> **RULE**: Every new project MUST be assigned a unique port from this table BEFORE creating it.
> Always set `strictPort: true` in `vite.config.js` so Vite fails loudly instead of silently stealing another project's port.

---

## ✅ Assigned Ports — ALL Projects

| Project | Folder | Frontend Port | Backend Port | Frontend URL | Backend URL |
|---|---|---|---|---|---|
| ASK Test Case GenBuddy | `MyTestingAcademy/` | **5173** | **5005** | http://localhost:5173 | http://localhost:5005 |
| AI Trial 1 | `MyTestingAcademy/` | **5174** | **3005** | http://localhost:5174 | http://localhost:3005 |
| TestForgeX | `My Projects/` | **5175** | **5000** | http://localhost:5175 | http://localhost:5000 |
| JobPilot_JP | `MyTestingAcademy/` | **5176** | _(none)_ | http://localhost:5176 | — |
| Ticket2Test AI | `MyTestingAcademy/` | **5177** | **8000** | http://localhost:5177 | http://localhost:8000 |

---

## 🔜 Next Available Ports

| Type | Next Available |
|---|---|
| Frontend (Vite) | **5178** |
| Backend (Node/Express) | **8001** |
| Backend (Python/FastAPI) | **8001** |

---

## 🔒 Rules for New Projects

1. **Check this file FIRST** — pick the next available port from the table above.
2. **Always add `strictPort: true`** in your `vite.config.js`:
   ```js
   server: {
     port: 5178,        // Your assigned port (next available)
     strictPort: true,  // REQUIRED — never auto-switch ports silently
   }
   ```
3. **Add the port comment block** at the top of `vite.config.js` for visibility (see existing projects as reference).
4. **Update this file** with the new project entry before starting development.

---

## ⚠️ Why `strictPort: true` Matters

Without it, if your chosen port is already in use, Vite **silently** picks the next port — which is likely another project's port, breaking it.

With `strictPort: true`, Vite will **crash immediately with a clear error**, telling you exactly what to fix instead of silently causing chaos.
