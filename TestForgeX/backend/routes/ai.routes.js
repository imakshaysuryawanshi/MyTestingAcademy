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
import { jiraService } from '../services/jira.service.js';

const router = Router();

// ─── Health & Prompt Inspection ───────────────────────────────────────────────

/** GET /api/ping-prompts — list all loaded prompt templates */
router.get('/ping-prompts', (req, res) => {
  const loaded = promptLoader.listPrompts();
  res.json({ status: 'success', total_prompts: loaded.length, loaded_prompts: loaded });
});

/** GET /api/providers — list available providers and their status */
router.get('/providers', async (req, res) => {
  const { ollamaUrl } = req.query;
  const { ollamaProvider } = await import('../providers/ollama.provider.js');
  const { groqProvider }   = await import('../providers/groq.provider.js');
  const { grokProvider }   = await import('../providers/grok.provider.js');

  const results = await Promise.all([
    ollamaProvider.isAvailable(ollamaUrl).then(ok => ({ name: 'ollama', available: ok })),
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
  const { title, criteria, settings } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const result = await llmService.generateTestPlan(title, criteria || "", settings);
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
  const { story, settings } = req.body;
  if (!story) return res.status(400).json({ error: 'story object is required' });

  try {
    const result = await llmService.generateTestCases(story, settings);
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
  const { story, settings } = req.body;
  if (!story) return res.status(400).json({ error: 'story object is required' });

  try {
    const result = await llmService.generateScenarios(story, settings);
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
  const { story, settings } = req.body;
  if (!story) return res.status(400).json({ error: 'story is required' });

  try {
    const result = await llmService.generateApiScenarios(story, settings);
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
  const { apiData, settings } = req.body;
  if (!apiData) return res.status(400).json({ error: 'apiData is required' });

  try {
    const result = await llmService.generateApiTestCases(apiData, settings);
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
  const { input, settings } = req.body;
  if (!input) return res.status(400).json({ error: 'input is required' });

  try {
    const result = await llmService.generateUserStories(input, settings);
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
  const { testCases, story, settings } = req.body;
  if (!testCases) return res.status(400).json({ error: 'testCases array is required' });

  try {
    const result = await llmService.analyzeCoverage(testCases, story || "", settings);
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
  const { testCaseTitle, settings } = req.body;
  if (!testCaseTitle) return res.status(400).json({ error: 'testCaseTitle is required' });

  try {
    const result = await llmService.generateCode(testCaseTitle, settings);
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
  const { url, settings } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const result = await llmService.analyzeURL(url, settings);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/url/analyze]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Jira Integration ──────────────────────────────────────────────────────────

/**
 * POST /api/jira/fetch
 * Body: { issueId: string, creds: { url, email, token } }
 */
router.post('/jira/fetch', async (req, res) => {
  const { issueId, creds } = req.body;
  if (!issueId) return res.status(400).json({ error: 'issueId is required' });
  if (!creds) return res.status(400).json({ error: 'Jira credentials are required' });

  try {
    const issue = await jiraService.fetchIssue(issueId, creds);
    res.json({ success: true, data: issue });
  } catch (err) {
    console.error('[/jira/fetch]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/jira/generate-artifacts
 * Body: { issueData: object, settings: object }
 */
router.post('/jira/generate-artifacts', async (req, res) => {
  const { issueData, settings } = req.body;
  if (!issueData) return res.status(400).json({ error: 'issueData is required' });

  try {
    const result = await llmService.generateJiraArtifacts(issueData, settings);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/jira/generate-artifacts]', err.message);
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
