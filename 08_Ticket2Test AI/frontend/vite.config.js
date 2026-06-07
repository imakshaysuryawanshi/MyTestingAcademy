import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// PORT: 5177 — Ticket2Test AI frontend (dedicated, do NOT change)
// PORT MAP for ALL GenAI10X projects:
//   5173 → ASK Test Case GenBuddy (frontend)      | 5005 → ASK Test Case GenBuddy (backend)
//   5174 → AI Trial 1 (frontend)                   | 3005 → AI Trial 1 (backend)
//   5175 → TestForgeX (frontend)                   | 5000 → TestForgeX (backend)
//   5176 → JobPilot_JP (frontend)                  |
//   5177 → Ticket2Test AI (frontend) ← this project| 8000 → Ticket2Test AI (backend)
//   5178 → (next new project)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true, // Fail loudly if port is taken — never silently use another port
  },
})
