import { createLLMService } from './LLMService.js';
import { PromptService } from './PromptService.js';

/**
 * Service for handling chat functionality
 */
export class ChatService {
  /**
   * Constructor
   * @param {Object} messageStorage - The message storage to use for saving messages
   * @param {Object} requestStorage - The storage to use for saving LLM requests
   */
  constructor(messageStorage, requestStorage = null) {
    this.messageStorage = messageStorage;
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
      throw new Error(`Failed to initialize ChatService: ${error.message}`);
    }
  }
  
  /**
   * Process a user message and get a response from the LLM
   * @param {string} userContent - The message content from the user
   * @param {string} userRole - The role of the user (default: "user")
   * @returns {Promise<Object>} - The response message with content, role, and timestamp
   */
  async processUserMessage(userContent, userRole = 'user') {
    this.validateUserMessage(userContent);
    
    // Continue with normal flow if message passed security check
    await this.storeUserMessage(userContent, userRole);
    
    const conversationHistory = await this.prepareConversationHistory(userContent, userRole);
    
    const llmResponse = await this.getLLMResponse(conversationHistory);
    
    const responseContent = this.extractAssistantContent(llmResponse);
    const assistantMessage = await this.storeAssistantMessage(responseContent);
    
    return assistantMessage;
  }
  
  /**
   * Validate that the user message is not empty
   * @param {string} content - The message content to validate
   * @private
   */
  validateUserMessage(content) {
    if (!content) {
      throw new Error('Message content is required');
    }
  }

  
  /**
   * Store the user message in storage
   * @param {string} content - The message content
   * @param {string} role - The role of the user
   * @returns {Promise<Object>} - The stored message
   * @private
   */
  async storeUserMessage(content, role) {
    const message = await this.messageStorage.addMessage({
      content,
      role,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Processing user message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
    return message;
  }
  
  /**
   * Prepare the conversation history with system prompt, last 10 messages, plus new message
   * @param {string} userContent - The new message content
   * @param {string} userRole - The role of the user
   * @returns {Promise<Array>} - The conversation history formatted for LLM
   * @private
   */
  async prepareConversationHistory(userContent, userRole) {
    try {
      // Load the system prompt
      const systemPrompt = await this.promptService.loadPrompt('system.prompt.xml');
      
      // Get previous messages from storage in chronological order (not reversed - this is the default)
      const previousMessages = await this.messageStorage.getMessages();
      
      // Return conversation history with system prompt first, without storing it
      return [
        // Add system prompt as first message
        {
          role: 'system',
          content: systemPrompt
        },
        // Add previous conversation messages
        ...previousMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      ];
    } catch (error) {
      console.error('Error preparing conversation history:', error);
      // If there's an error loading the system prompt, continue without it
      const previousMessages = await this.messageStorage.getMessages();
      
      return [
        ...previousMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: userRole,
          content: userContent
        }
      ];
    }
  }
  
  /**
   * Get response from LLM API
   * @param {Array} messages - The conversation history
   * @returns {Promise<Object>} - The LLM response
   * @private
   */
  async getLLMResponse(messages) {
    try {
      console.log('Calling LLM API...');
      const response = await this.llmService.sendMessage(messages);
      console.log('LLM API response received');
      
      this.validateLLMResponse(response);
      return response;
    } catch (error) {
      console.error('Error in LLM API call:', error.message);
      throw new Error(`LLM API call failed: ${error.message}`);
    }
  }
  
  /**
   * Validate that the LLM response is valid
   * @param {Object} response - The LLM response to validate
   * @private
   */
  validateLLMResponse(response) {
    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error('Invalid response from LLM service');
    }
  }
  
  /**
   * Extract assistant message content from LLM response
   * @param {Object} llmResponse - The response from the LLM
   * @returns {string} - The assistant message content
   * @private
   */
  extractAssistantContent(llmResponse) {
    return llmResponse.choices[0].message.content;
  }

  /**
   * Store the assistant message in storage
   * @param {string} content - The assistant message content
   * @returns {Promise<Object>} - The stored assistant message
   * @private
   */
  async storeAssistantMessage(content) {
    const assistantMessage = await this.messageStorage.addMessage({
      content,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });
    return {
      content,
      role: 'assistant',
      timestamp: assistantMessage.timestamp
    };
  }
  
  /**
   * Get all chat messages
   * @param {number|null} limit - Maximum number of messages to retrieve (null for all)
   * @returns {Promise<Array>} - Array of messages
   */
  async getAllMessages(limit = null) {
    // For UI, we maintain original behavior (not reversed - messages in chronological order)
    return this.messageStorage.getMessages(limit, false);
  }
  
  /**
   * Clear all chat messages and requests
   * @returns {Promise<Array>} - Array of messages after clearing and adding initial message
   */
  async clearAllMessages() {
    const clearMessagesPromise = this.messageStorage.clearMessages();
    
    // If request storage exists, clear it too
    const clearRequestsPromise = this.requestStorage 
      ? this.requestStorage.clearMessages() 
      : Promise.resolve();
    
    // Wait for both operations to complete
    await Promise.all([clearMessagesPromise, clearRequestsPromise]);
    
    // Load and add the initial welcome message after clearing
    try {
      const initialMessage = await this.promptService.loadPrompt('initial-message.html');
      await this.messageStorage.addMessage({
        content: initialMessage,
        role: 'assistant',
        timestamp: new Date().toISOString()
      });
      console.log('Initial welcome message added successfully');
      
      // Return the updated message list to be sent to frontend
      return this.getAllMessages();
    } catch (error) {
      console.error('Error adding initial welcome message:', error);
      // Even in case of error, return the current state of messages
      return this.getAllMessages();
    }
  }
  
  /**
   * Add a single message to storage
   * @param {Object} messageData - The message data
   * @returns {Promise<Object>} - The saved message
   */
  async addMessage(messageData) {
    this.validateMessageContent(messageData.content);
    const formattedMessage = this.formatMessage(messageData);
    return this.messageStorage.addMessage(formattedMessage);
  }
  
  /**
   * Validate that message content is not empty
   * @param {string} content - The content to validate
   * @private
   */
  validateMessageContent(content) {
    if (!content) {
      throw new Error('Message content is required');
    }
  }
  
  /**
   * Format a message with default values if needed
   * @param {Object} messageData - The raw message data
   * @returns {Object} - The formatted message
   * @private
   */
  formatMessage(messageData) {
    return {
      content: messageData.content,
      role: messageData.role || 'user',
      timestamp: messageData.timestamp || new Date().toISOString()
    };
  }
}

/**
 * Factory function to create a Chat service
 * @param {Object} messageStorage - The message storage instance to use
 * @param {Object} requestStorage - Optional storage for LLM requests
 * @returns {ChatService} - Configured Chat service instance
 */
export const createChatService = (messageStorage, requestStorage = null) => {
  validateMessageStorage(messageStorage);
  return new ChatService(messageStorage, requestStorage);
};

/**
 * Validate that message storage is provided
 * @param {Object} messageStorage - The message storage to validate
 * @private
 */
function validateMessageStorage(messageStorage) {
  if (!messageStorage) {
    throw new Error('Message storage is required for ChatService');
  }
}
