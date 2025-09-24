import { promises as fs } from 'fs';
import path from 'path';

/**
 * Simple storage for debug information that stores only the latest request/response
 */
export class DebugStorage {
    constructor(filePath) {
        this.filePath = filePath;
    }

    /**
     * Store debug information (overwrites previous data)
     * @param {Object} debugInfo - Debug information to store
     */
    async storeDebugInfo(debugInfo) {
        try {
            const dataToStore = {
                timestamp: new Date().toISOString(),
                ...debugInfo
            };
            
            await fs.writeFile(this.filePath, JSON.stringify(dataToStore, null, 2), 'utf8');
        } catch (error) {
            console.error('Error storing debug info:', error);
        }
    }

    /**
     * Get the latest debug information
     * @returns {Promise<Object|null>} Latest debug info or null if none exists
     */
    async getDebugInfo() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is invalid, return null
            return null;
        }
    }

    /**
     * Clear debug information
     */
    async clearDebugInfo() {
        try {
            await fs.unlink(this.filePath);
        } catch (error) {
            // File doesn't exist, ignore
        }
    }
}

/**
 * Factory function to create a DebugStorage instance
 * @param {string} filePath - Path to the debug storage file
 * @returns {DebugStorage} Debug storage instance
 */
export function createDebugStorage(filePath) {
    return new DebugStorage(filePath);
}
