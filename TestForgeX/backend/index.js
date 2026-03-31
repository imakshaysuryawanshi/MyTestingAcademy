import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { promptLoader } from './src/utils/promptLoader.js';
import aiRouter from './routes/ai.routes.js';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://frontend-rho-cyan-84c2pqtvqu.vercel.app',
  'https://testforgex-gvr4gp5md-akshaysuryawanshi.vercel.app',
  /\.vercel\.app$/  // catch all preview deployments
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
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
