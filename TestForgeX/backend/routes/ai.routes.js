/**
 * AI Routes — Express Router
 * 
 * All AI inference endpoints for the TestForgeX platform.
 * Each route accepts POST with a JSON body and returns structured AI output.
 * 
 * Base path: /api  (mounted in index.js)
 */

import { Router } from 'express';
import { llmService } from '../services/llm.service.js';
import { promptLoader } from '../src/utils/promptLoader.js';

const router = Router();

// ─── Health & Prompt Inspection ───────────────────────────────────────────────

/** GET /api/ping-prompts — list all loaded prompt templates */
router.get('/ping-prompts', (req, res) => {
  const loaded = promptLoader.listPrompts();
  res.json({ status: 'success', total_prompts: loaded.length, loaded_prompts: loaded });
});

/** GET /api/providers — list available providers and their status */
router.get('/providers', async (req, res) => {
  const { ollamaProvider } = await import('../providers/ollama.provider.js');
  const { groqProvider }   = await import('../providers/groq.provider.js');
  const { grokProvider }   = await import('../providers/grok.provider.js');

  const results = await Promise.all([
    ollamaProvider.isAvailable().then(ok => ({ name: 'ollama', available: ok })),
    groqProvider.isAvailable().then(ok   => ({ name: 'groq',   available: ok })),
    grokProvider.isAvailable().then(ok   => ({ name: 'grok',   available: ok })),
  ]);

  res.json({ providers: results });
});

// ─── Test Plan ────────────────────────────────────────────────────────────────

/**
 * POST /api/testplan/generate
 * Body: { context: string }
 */
router.post('/testplan/generate', async (req, res) => {
  const { title, criteria } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const result = await llmService.generateTestPlan(title, criteria || "");
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/testplan/generate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Test Cases ───────────────────────────────────────────────────────────────

/**
 * POST /api/testcases/generate
 * Body: { story: { title, description, acceptance_criteria } }
 */
router.post('/testcases/generate', async (req, res) => {
  const { story } = req.body;
  if (!story) return res.status(400).json({ error: 'story object is required' });

  try {
    const result = await llmService.generateTestCases(story);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/testcases/generate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Test Scenarios ──────────────────────────────────────────────────────────
/**
 * POST /api/scenarios/generate
 * Body: { story: { title, description, acceptance_criteria } }
 */
router.post('/scenarios/generate', async (req, res) => {
  const { story } = req.body;
  if (!story) return res.status(400).json({ error: 'story object is required' });

  try {
    const result = await llmService.generateScenarios(story);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/scenarios/generate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── API Test Scenarios ───────────────────────────────────────────────────────

/**
 * POST /api/api-scenarios/generate
 * Body: { story: string | object }
 */
router.post('/api-scenarios/generate', async (req, res) => {
  const { story } = req.body;
  if (!story) return res.status(400).json({ error: 'story is required' });

  try {
    const result = await llmService.generateApiScenarios(story);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/api-scenarios/generate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── API Test Cases ───────────────────────────────────────────────────────────

/**
 * POST /api/api-testcases/generate
 * Body: { apiData: string | object }
 */
router.post('/api-testcases/generate', async (req, res) => {
  const { apiData } = req.body;
  if (!apiData) return res.status(400).json({ error: 'apiData is required' });

  try {
    const result = await llmService.generateApiTestCases(apiData);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/api-testcases/generate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── User Stories ─────────────────────────────────────────────────────────────

/**
 * POST /api/userstory/generate
 * Body: { input: string }
 */
router.post('/userstory/generate', async (req, res) => {
  const { input } = req.body;
  if (!input) return res.status(400).json({ error: 'input is required' });

  try {
    const result = await llmService.generateUserStories(input);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/userstory/generate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Coverage Analysis ────────────────────────────────────────────────────────

/**
 * POST /api/coverage/analyze
 * Body: { testCases: array }
 */
router.post('/coverage/analyze', async (req, res) => {
  const { testCases } = req.body;
  if (!testCases) return res.status(400).json({ error: 'testCases array is required' });

  try {
    const result = await llmService.analyzeCoverage(testCases);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/coverage/analyze]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Code Generation ──────────────────────────────────────────────────────────

/**
 * POST /api/codegen/generate
 * Body: { testCaseTitle: string }
 */
router.post('/codegen/generate', async (req, res) => {
  const { testCaseTitle } = req.body;
  if (!testCaseTitle) return res.status(400).json({ error: 'testCaseTitle is required' });

  try {
    const result = await llmService.generateCode(testCaseTitle);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/codegen/generate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── URL Analyzer ─────────────────────────────────────────────────────────────

/**
 * POST /api/url/analyze
 * Body: { url: string }
 */
router.post('/url/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const result = await llmService.analyzeURL(url);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/url/analyze]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Generic Prompt Test Sandbox ─────────────────────────────────────────────

/**
 * POST /api/test-prompt
 * Body: { alias: string, variables: object }
 */
router.post('/test-prompt', (req, res) => {
  const { alias, variables } = req.body;
  if (!alias) return res.status(400).json({ error: 'alias is required' });

  try {
    const compiled = promptLoader.getPrompt(alias, variables || {});
    res.json({ success: true, compiled });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

export default router;
