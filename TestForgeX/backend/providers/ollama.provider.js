/**
 * Ollama Provider
 * Connects to a locally running Ollama instance (default: http://localhost:11434)
 * Supports models: llama3, deepseek-coder, mistral, etc.
 */

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';

export const ollamaProvider = {
  name: 'ollama',

  /**
   * Send a prompt to Ollama and return the response text
   * @param {string} prompt - The compiled prompt string
   * @param {string} model  - Model name (e.g. 'llama3:8b-instruct-q4_0')
   * @param {object} options - { temperature, maxTokens }
   */
  async generate(prompt, model = 'llama3:8b-instruct-q4_0', options = {}) {
    const { temperature = 0.3, maxTokens = 700 } = options;

    try {
      const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama API error ${response.status}: ${err}`);
      }

      const json = await response.json();
      return json.response?.trim() || '';
    } catch (err) {
      throw new Error(`[OllamaProvider] ${err.message}`);
    }
  },

  /**
   * List all locally available models
   */
  async listModels() {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    const json = await res.json();
    return (json.models || []).map(m => m.name);
  },

  isAvailable: async () => {
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
