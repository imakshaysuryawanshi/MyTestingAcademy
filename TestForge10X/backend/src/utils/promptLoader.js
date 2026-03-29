import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PromptLoader {
  constructor() {
    this.prompts = new Map();
    this.promptsDir = path.resolve(__dirname, '../../prompts');
  }

  /**
   * Recursively reads all .md files in the given directory and caches them.
   */
  async initialize() {
    try {
      console.log(`[PromptLoader] Scanning directory: ${this.promptsDir}`);
      this._scanDirectory(this.promptsDir);
      console.log(`[PromptLoader] Successfully loaded ${this.prompts.size} prompt templates.`);
    } catch (err) {
      console.error('[PromptLoader] Failed to initialize prompts:', err);
    }
  }

  _scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
      console.warn(`[PromptLoader] Directory does not exist: ${dir}`);
      return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this._scanDirectory(fullPath);
      } else if (stat.isFile() && file.endsWith('.md')) {
        // Create an alias based on folder/filename (e.g., 'codegen/selenium-java')
        const relativePath = path.relative(this.promptsDir, fullPath);
        const alias = relativePath.replace(/\\/g, '/').replace('.md', '');
        
        const content = fs.readFileSync(fullPath, 'utf-8');
        this.prompts.set(alias, content);
      }
    }
  }

  /**
   * Retrieves a loaded prompt template and dynamically replaces {{VARIABLES}} with provided values
   * @param {string} alias - The relative path of the prompt without .md (e.g., 'testplan/universal')
   * @param {Object} variables - Key-value pairs to replace in the prompt (e.g., { TITLE: "Login" })
   * @returns {string} The fully compiled prompt ready for AI
   */
  getPrompt(alias, variables = {}) {
    let template = this.prompts.get(alias);
    
    if (!template) {
      throw new Error(`[PromptLoader] Prompt template '${alias}' not found.`);
    }

    // Replace all instances of {{KEY}} with the variable value
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value);
    }

    return template;
  }

  /**
   * Get all loaded prompt keys (useful for debugging/health check)
   */
  listPrompts() {
    return Array.from(this.prompts.keys());
  }
}

// Export a singleton instance
export const promptLoader = new PromptLoader();
