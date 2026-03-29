import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { promptLoader } from './src/utils/promptLoader.js';
import aiRouter from './routes/ai.routes.js';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI Prompts Engine globally before server start
await promptLoader.initialize();

// Mount AI routes under /api
app.use('/api', aiRouter);

// Root health check
app.get('/', (req, res) => {
  res.json({
    status: 'TestForgeX Backend Running',
    port: PORT,
    prompts_loaded: promptLoader.listPrompts().length,
    endpoints: [
      'GET  /api/ping-prompts',
      'GET  /api/providers',
      'POST /api/testplan/generate',
      'POST /api/testcases/generate',
      'POST /api/userstory/generate',
      'POST /api/coverage/analyze',
      'POST /api/codegen/generate',
      'POST /api/url/analyze',
      'POST /api/test-prompt',
    ]
  });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[Server] Core running on http://localhost:${PORT}`);
    console.log(`[Server] Prompt Engine loaded ${promptLoader.listPrompts().length} configurations.`);
    console.log(`[Server] LLM Provider preference: ${process.env.LLM_PROVIDER || 'ollama'}`);
  });
}

export default app;
