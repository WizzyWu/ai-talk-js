import { promises as fs } from 'fs';
import path from 'path';
import { MessageStorageInterface } from './MessageStorageInterface.js';

/**
 * File-based implementation of message storage
 * Stores messages in a JSON file
 */
export class FileMessageStorage extends MessageStorageInterface {
  /**
   * Constructor
   * @param {string} filePath - Path to the JSON file where messages will be stored
   */
  constructor(filePath) {
    super();
    this.filePath = filePath;
    this.ensureFileExists();
  }

  /**
   * Make sure the storage file exists
   * @returns {Promise<void>}
   */
  async ensureFileExists() {
    try {
      await fs.access(this.filePath);
    } catch (error) {
      // File doesn't exist, create it with empty array
      await fs.writeFile(this.filePath, JSON.stringify([]));
    }
  }

  /**
   * Read messages from file
   * @returns {Promise<Array>} - Array of messages
   */
  async readMessages() {
    const data = await fs.readFile(this.filePath, 'utf8');
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing messages file:', error);
      return [];
    }
  }

  /**
   * Write messages to file
   * @param {Array} messages - Array of messages to write
   * @returns {Promise<void>}
   */
  async writeMessages(messages) {
    await fs.writeFile(this.filePath, JSON.stringify(messages, null, 2), 'utf8');
  }

  /**
   * Add a new message to storage
   * @param {Object} message - The message to add
   * @returns {Promise<Object>} - The added message with ID
   */
  async addMessage(message) {
    const messages = await this.readMessages();
    
    // Generate ID (max ID + 1)
    const maxId = messages.length > 0 
      ? Math.max(...messages.map(m => m.id))
      : 0;
    
    const newMessage = {
      id: maxId + 1,
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    };
    
    messages.push(newMessage);
    await this.writeMessages(messages);
    
    return newMessage;
  }

  /**
   * Clear all messages from storage
   * @returns {Promise<void>}
   */
  async clearMessages() {
    await this.writeMessages([]);
  }

  /**
   * Get messages from storage
   * @param {number|null} quantity - Number of messages to retrieve (null for all)
   * @param {boolean} reverseOrder - Whether to return messages in reverse order (newest first)
   * @returns {Promise<Array>} - Array of messages
   */
  async getMessages(quantity = null, reverseOrder = false) {
    const messages = await this.readMessages();
    
    // If quantity is specified, return only that many
    if (quantity && typeof quantity === 'number') {
      // Get the most recent messages by slicing from the end
      const recentMessages = messages.slice(-quantity);
      // Return in specified order
      return reverseOrder ? recentMessages.reverse() : recentMessages;
    }
    
    // Otherwise return all messages in specified order
    return reverseOrder ? [...messages].reverse() : messages;
  }
}
