import { createLLMService } from './LLMService.js';
import { PromptService } from './PromptService.js';

/**
 * Service for text enhancement functionality
 */
export class TextEnhancementService {
  /**
   * Constructor
   * @param {Object} requestStorage - The storage to use for saving LLM requests
   */
  constructor(requestStorage = null) {
    this.requestStorage = requestStorage;
    this.llmService = this.initializeLLMService(requestStorage);
    this.promptService = new PromptService();
  }
  
  /**
   * Initialize the LLM service
   * @param {Object} requestStorage - The storage for LLM requests
   * @returns {Object} - Initialized LLM service
   * @private
   */
  initializeLLMService(requestStorage) {
    try {
      return createLLMService(requestStorage);
    } catch (error) {
      console.error('Error initializing LLM service:', error);
      throw new Error(`Failed to initialize TextEnhancementService: ${error.message}`);
    }
  }
  
  /**
   * Enhance the provided text using AI
   * @param {string} originalText - The text to enhance
   * @returns {Promise<Object>} - The enhanced text response
   */
  async enhanceText(originalText) {
    try {
      this.validateTextInput(originalText);
      const systemPrompt = await this.getEnhancementPrompt();
      const messages = this.buildLLMMessages(systemPrompt, originalText);
      const llmResponse = await this.sendToLLM(messages);
      this.validateLLMResponse(llmResponse);
      const enhancedContent = this.extractEnhancedContent(llmResponse);
      return this.buildSuccessResponse(originalText, enhancedContent);
    } catch (error) {
      this.logEnhancementError(error);
      throw new Error(`Text enhancement failed: ${error.message}`);
    }
  }

  validateTextInput(originalText) {
    if (!originalText || typeof originalText !== 'string' || originalText.trim().length === 0) {
      throw new Error('Valid text content is required for enhancement');
    }
  }

  async getEnhancementPrompt() {
    return await this.promptService.loadPrompt('text-enhancement.prompt.xml');
  }

  buildLLMMessages(systemPrompt, originalText) {
    return [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: originalText.trim()
      }
    ];
  }

  async sendToLLM(messages) {
    return await this.llmService.sendMessage(messages);
  }

  validateLLMResponse(llmResponse) {
    if (!llmResponse || !llmResponse.choices || !llmResponse.choices[0] || !llmResponse.choices[0].message) {
      throw new Error('Invalid response from LLM service');
    }
  }

  extractEnhancedContent(llmResponse) {
    return llmResponse.choices[0].message.content;
  }

  buildSuccessResponse(originalText, enhancedContent) {
    return {
      success: true,
      originalText: originalText.trim(),
      enhancedText: enhancedContent.trim(),
      timestamp: new Date().toISOString()
    };
  }

  logEnhancementError(error) {
    console.error('Error enhancing text:', error);
  }
}

/**
 * Factory function to create a TextEnhancementService instance
 * @param {Object} requestStorage - Optional request storage
 * @returns {TextEnhancementService} - New TextEnhancementService instance
 */
export function createTextEnhancementService(requestStorage = null) {
  return new TextEnhancementService(requestStorage);
}
