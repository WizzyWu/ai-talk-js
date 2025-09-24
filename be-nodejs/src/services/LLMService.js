import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

/**
 * Service for interacting with the OpenAI LLM API
 */
export class LLMService {
  /**
   * Constructor
   * @param {Object} config - Configuration for the LLM service
   * @param {string} config.apiKey - The OpenAI API key
   * @param {string} config.apiUrl - The OpenAI API URL
   * @param {string} config.model - The LLM model to use
   * @param {string} config.additionalModel - Additional LLM model option
   * @param {Object} config.requestStorage - Optional storage for LLM requests
   */
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.model = config.model;
    this.additionalModel = config.additionalModel;
    this.requestStorage = config.requestStorage;
    
    if (!this.apiKey) {
      throw new Error('LLM API key is required');
    }
    
    if (!this.apiUrl) {
      throw new Error('LLM API URL is required');
    }
    
    if (!this.model) {
      throw new Error('LLM model is required');
    }

    if (!this.additionalModel) {
      console.warn('No additional model configured, using default model only');
    }
  }  

  /**
   * Send a message to the LLM and get a response
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the API call
   * @returns {Promise<Object>} - The LLM response
   */
  async sendMessage(messages, options = {}) {
    try {
      const requestBody = {
        messages,
        model: options.model || this.model,
        ...options
      };
      
      console.log('Sending request to OpenAI API:', JSON.stringify(requestBody, null, 2));
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      console.log('OpenAI API response received:', JSON.stringify(response.data, null, 2));
      
      // Store request in storage if available
      await this.storeRequest(requestBody, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error calling OpenAI API:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw new Error(`Failed to get LLM response: ${error.message}`);
    }
  }
  
  /**
   * Store the request and response in the request storage
   * @param {Object} request - The request sent to the LLM
   * @param {Object} response - The response received from the LLM
   * @private
   */
  async storeRequest(request, response) {
    if (this.requestStorage) {
      try {
        // Get user message content from the last message in the request
        const userMessages = request.messages.filter(msg => msg.role === 'user');
        const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
        
        // Get assistant response content
        const responseContent = response.choices && response.choices.length > 0 
          ? response.choices[0].message.content 
          : '';
        
        // Create a title from the first few words of the user message
        const titleWords = lastUserMessage.split(' ').slice(0, 5).join(' ');
        const title = titleWords + (lastUserMessage.length > titleWords.length ? '...' : '');
        
        // Store the request
        await this.requestStorage.addMessage({
          title,
          content: {
            request: request,
            response: response
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error storing LLM request:', error);
        // Don't throw - we don't want to fail the main flow if storage fails
      }
    }
  }
  
  /**
   * Simple method to ask a single question and get a response
   * @param {string} content - The user's question or prompt
   * @param {Object} options - Additional options for the API call
   * @returns {Promise<string>} - The LLM's text response
   */
  async ask(content, options = {}) {
    const messages = [
      {
        role: 'user',
        content
      }
    ];
    
    const response = await this.sendMessage(messages, options);
    
    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    }
    
    throw new Error('No response content from LLM');
  }
  
  /**
   * Continue a conversation with previous messages
   * @param {Array} conversation - Array of previous messages
   * @param {string} newMessage - The new user message to add
   * @param {Object} options - Additional options for the API call
   * @returns {Promise<Object>} - The full response from the LLM
   */
  async continueConversation(conversation, newMessage, options = {}) {
    const messages = [...conversation];
    
    // Add the new message
    messages.push({
      role: 'user',
      content: newMessage
    });
    
    // Get response from LLM
    const response = await this.sendMessage(messages, options);
    
    // Add the response to the conversation
    if (response.choices && response.choices.length > 0) {
      const assistantMessage = response.choices[0].message;
      messages.push(assistantMessage);
    }
    
    return {
      conversation: messages,
      response
    };
  }
  
  /**
   * Send a message using the additional model if available
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the API call
   * @returns {Promise<Object>} - The LLM response
   */
  async sendMessageWithAdditionalModel(messages, options = {}) {
    if (!this.additionalModel) {
      console.log('No additional model configured, using default model instead');
      return this.sendMessage(messages, options);
    }
    
    // Override options to use the additional model
    const additionalOptions = {
      ...options,
      model: this.additionalModel
    };
    
    return this.sendMessage(messages, additionalOptions);
  }
  
  /**
   * Ask a question using the additional model if available
   * @param {string} content - The user's question or prompt
   * @param {Object} options - Additional options for the API call
   * @returns {Promise<string>} - The LLM's text response
   */
  async askWithAdditionalModel(content, options = {}) {
    if (!this.additionalModel) {
      console.log('No additional model configured, using default model instead');
      return this.ask(content, options);
    }
    
    const messages = [
      {
        role: 'user',
        content
      }
    ];
    
    // Use the additional model
    const additionalOptions = {
      ...options,
      model: this.additionalModel
    };
    
    const response = await this.sendMessage(messages, additionalOptions);
    
    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    }
    
    throw new Error('No response content from LLM');
  }
}

/**
 * Factory function to create an LLM service with configuration from apiConfig
 * @param {Object} requestStorage - Optional storage for LLM requests
 * @returns {LLMService} - Configured LLM service instance
 */
export const createLLMService = (requestStorage = null) => {
  // Get configuration from apiConfig.js (which loads from environment variables)
  const { apiKey, apiUrl, model, additionalModel } = apiConfig.openai;
  
  if (!apiKey || !apiUrl || !model) {
    throw new Error('Missing required environment variables (LLM_KEY, LLM_API_URL, LLM_MODEL).');
  }
  
  return new LLMService({
    apiKey,
    apiUrl,
    model,
    additionalModel,
    requestStorage
  });
};
