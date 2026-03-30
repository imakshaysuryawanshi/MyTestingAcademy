/**
 * Ollama Provider
 * Connects to a locally running Ollama instance (default: http://localhost:11434)
 * Supports models: llama3, deepseek-coder, mistral, etc.
 */

import axios from 'axios';

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

export const ollamaProvider = {
  name: 'ollama',

  /**
   * Send a prompt to Ollama and return the response text
   * @param {string} prompt - The compiled prompt string
   * @param {string} model  - Model name (e.g. 'llama3:latest')
   * @param {object} options - { temperature, maxTokens, url }
   */
  async generate(prompt, model = 'llama3:latest', options = {}) {
    const { temperature = 0.3, maxTokens = 700, url = OLLAMA_BASE } = options;

    try {
      const response = await axios.post(`${url}/api/generate`, {
          model,
          prompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
      }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 600000 // 10 minutes timeout for heavy AI generation
      });

      return response.data.response?.trim() || '';
    } catch (err) {
      if (err.response) {
         throw new Error(`Ollama API error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      }
      throw new Error(`[OllamaProvider] ${err.message}`);
    }
  },

  /**
   * List all locally available models
   */
  async listModels(url = OLLAMA_BASE) {
    const res = await axios.get(`${url}/api/tags`);
    return (res.data.models || []).map(m => m.name);
  },

  isAvailable: async (url = OLLAMA_BASE) => {
    try {
      const target = url || OLLAMA_BASE;
      const res = await axios.get(`${target}/api/tags`, { timeout: 5000 });
      return res.status === 200;
    } catch {
      return false;
    }
  },
};
