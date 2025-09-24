import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service for working with prompts
 */
export class PromptService {
  // Define the prompts path as a constant inside the class
  static PROMPTS_PATH = path.join(__dirname, '../prompts');
  
  /**
   * Creates a new prompt service instance
   */
  constructor() {
    this.promptsPath = PromptService.PROMPTS_PATH;
  }

  /**
   * Loads a prompt by name and returns its content
   * @param {string} promptName - Name of the prompt to load
   * @returns {Promise<string>} - The content of the prompt
   * @throws {Error} - If prompt doesn't exist or can't be read
   */
  async loadPrompt(promptName) {
    try {
      const promptPath = path.join(this.promptsPath, promptName);
      const content = await fs.readFile(promptPath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Failed to load prompt "${promptName}": ${error.message}`);
    }
  }
}
