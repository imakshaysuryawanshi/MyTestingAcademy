/**
 * Groq Provider
 * Uses Groq's ultra-fast inference API (groq.com)
 * Requires: GROQ_API_KEY in .env
 * Supports models: llama3-70b-8192, mixtral-8x7b-32768, gemma-7b-it, etc.
 */

const GROQ_BASE = 'https://api.groq.com/openai/v1';

export const groqProvider = {
  name: 'groq',

  /**
   * Send a prompt to Groq and return the response text
   * @param {string} prompt  - The compiled prompt string
   * @param {string} model   - Model name (e.g. 'llama3-70b-8192')
   * @param {object} options - { temperature, maxTokens }
   */
  async generate(prompt, model = 'llama3-70b-8192', options = {}) {
    const { temperature = 0.3, maxTokens = 700 } = options;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('[GroqProvider] GROQ_API_KEY is not configured in .env');
    }

    try {
      const response = await fetch(`${GROQ_BASE}/chat/completions`, {
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
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Groq API error ${response.status}: ${err?.error?.message}`);
      }

      const json = await response.json();
      return json.choices?.[0]?.message?.content?.trim() || '';
    } catch (err) {
      throw new Error(`[GroqProvider] ${err.message}`);
    }
  },

  /**
   * List available Groq models
   */
  async listModels() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return [];
    const res = await fetch(`${GROQ_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = await res.json();
    return (json.data || []).map(m => m.id);
  },

  isAvailable: async () => !!process.env.GROQ_API_KEY,
};
