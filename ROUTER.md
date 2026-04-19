# Antigravity Project Router & Port Registry

To prevent projects from "merging" or conflicting on localhost, each project is assigned a **Strict Port**. This ensures that if one project is running, another cannot accidentally "take over" its port or confuse the browser.

## 🚀 Active Projects
| Project Name | Frontend Port | Backend Port | LocalStorage Prefix |
| :--- | :---: | :---: | :--- |
| **ASK Test Case GenBuddy** | [5173](http://localhost:5173) | 5005 | `(generic)` |
| **AI Trial 1** | [5174](http://localhost:5174) | 3005 | `ai_trial_` |
| **TestForgeX** | [5175](http://localhost:5175) | 5001 | `tfx_` |
| **JobPilot_JP** | [5176](http://localhost:5176) | N/A | `jp-` |

---

## 🔍 Analysis: Why "Merging" happens
1. **Implicit Port Jumping**: Without `strictPort: true`, if Port 5173 is occupied, Vite silently jumps to 5174. If you have two tabs open, you might think you're looking at App A but it's actually App B on a new port.
2. **Shared Origin (localhost)**: All these apps run on `localhost`. This means they share the same **Origin**, and thus share the same **LocalStorage** and **Cookies**. If two apps use a key called `theme`, they will overwrite each other.
3. **Caching**: Chrome / Edge often cache `localhost` aggressively.

## 🛠️ How to prevent future conflicts

### 1. Always use `strictPort: true`
When creating a new project, update your `vite.config.js` (or `.ts`) immediately:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 5177, // Choose the next available FE port
    strictPort: true, 
  }
})
```

### 2. Namespace your LocalStorage
Always prefix your keys with the project name:
- ✅ `localStorage.setItem('myproject_settings', ...)`

### 3. Change Backend Ports
Do not leave backends on port `5000` or `3000` as these are most commonly used and will conflict quickly. Use `5001`, `5002`, etc.

---
*Last Updated: 2026-03-31*
