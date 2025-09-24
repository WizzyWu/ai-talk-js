/**
 * Abstract base class for message storage
 * Defines the interface that all storage implementations must follow
 */
export class MessageStorageInterface {
  /**
   * Add a new message to storage
   * @param {Object} message - The message to add
   * @returns {Promise<Object>} - The added message
   */
  async addMessage(message) {
    throw new Error('Method addMessage() must be implemented');
  }

  /**
   * Clear all messages from storage
   * @returns {Promise<void>}
   */
  async clearMessages() {
    throw new Error('Method clearMessages() must be implemented');
  }

  /**
   * Get messages from storage
   * @param {number|null} quantity - Number of messages to retrieve (null for all)
   * @param {boolean} reverseOrder - Whether to return messages in reverse order (newest first)
   * @returns {Promise<Array>} - Array of messages
   */
  async getMessages(quantity = null, reverseOrder = false) {
    throw new Error('Method getMessages() must be implemented');
  }
}
