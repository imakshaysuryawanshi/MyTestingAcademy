/**
 * Grok Provider (xAI)
 * Uses xAI's Grok API — OpenAI-compatible interface
 * Requires: GROK_API_KEY in .env
 * Supported models: grok-beta, grok-2, grok-2-mini
 */

const GROK_BASE = 'https://api.x.ai/v1';

export const grokProvider = {
  name: 'grok',

  /**
   * Send a prompt to Grok (xAI) and return the response text
   * @param {string} prompt  - The compiled prompt string
   * @param {string} model   - Model name (e.g. 'grok-beta')
   * @param {object} options - { temperature, maxTokens }
   */
  async generate(prompt, model = 'grok-beta', options = {}) {
    const { temperature = 0.3, maxTokens = 700 } = options;
    const apiKey = process.env.GROK_API_KEY;

    if (!apiKey) {
      throw new Error('[GrokProvider] GROK_API_KEY is not configured in .env');
    }

    try {
      const response = await fetch(`${GROK_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Grok API error ${response.status}: ${err?.error?.message}`);
      }

      const json = await response.json();
      return json.choices?.[0]?.message?.content?.trim() || '';
    } catch (err) {
      throw new Error(`[GrokProvider] ${err.message}`);
    }
  },

  /**
   * List available Grok models
   */
  async listModels() {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) return [];
    const res = await fetch(`${GROK_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = await res.json();
    return (json.data || []).map(m => m.id);
  },

  isAvailable: async () => !!process.env.GROK_API_KEY,
};
