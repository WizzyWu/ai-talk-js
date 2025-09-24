import path from 'path';
import { fileURLToPath } from 'url';
import { FileMessageStorage } from './FileMessageStorage.js';

/**
 * Factory for creating message storage instances
 */
export class MessageStorageFactory {
  /**
   * Get a message storage implementation
   * @param {string} type - Type of storage ('file' by default)
   * @param {Object} options - Options for the storage implementation
   * @returns {Object} - A message storage implementation
   */
  static getStorage(type = 'file', options = {}) {
    // Get the directory name of the current module
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    
    switch (type.toLowerCase()) {
      case 'file':
        const filePath = options.filePath || path.join(process.cwd(), 'messages.json');
        return new FileMessageStorage(filePath);
      
      // We could add more implementations here in the future
      // case 'mongodb':
      //   return new MongoDBMessageStorage(options.connectionString);
      
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
  
  /**
   * Get a request storage implementation
   * @param {string} type - Type of storage ('file' by default)
   * @param {Object} options - Options for the storage implementation
   * @returns {Object} - A request storage implementation using FileMessageStorage
   */
  static getRequestStorage(type = 'file', options = {}) {
    switch (type.toLowerCase()) {
      case 'file':
        const filePath = options.filePath || path.join(process.cwd(), 'requests.json');
        return new FileMessageStorage(filePath);
      
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}
