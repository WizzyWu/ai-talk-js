import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { specs } from './src/config/swagger.js';
import { MessageStorageFactory } from './src/storage/MessageStorageFactory.js';
import { createChatService } from './src/services/ChatService.js';

// Load environment variables from .env file
dotenv.config();

// Get the directory name of the current module (equivalent to __dirname in CommonJS)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize message storage
const messageStorage = MessageStorageFactory.getStorage('file', {
  filePath: path.join(__dirname, 'messages.json')
});

// Initialize request storage
const requestStorage = MessageStorageFactory.getRequestStorage('file', {
  filePath: path.join(__dirname, 'requests.json')
});

// Initialize chat service
const chatService = createChatService(messageStorage, requestStorage);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Messages API Documentation"
}));

/**
 * @openapi
 * /api/messages:
 *   get:
 *     summary: Get all messages
 *     description: Returns a list of all messages from storage
 *     tags:
 *       - Messages
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of messages to return
 *     responses:
 *       200:
 *         description: Successfully retrieved messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessagesListResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/api/messages', async (req, res) => {
  try {
    // Log request
    console.log('GET /api/messages request received');
    
    // Get query parameter for limiting the number of messages
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    
    // Get messages using the chat service
    const messages = await chatService.getAllMessages(limit);
    
    // Return messages
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      error: "Server error while retrieving messages"
    });
  }
});

/**
 * @openapi
 * /api/messages:
 *   post:
 *     summary: Add a new message
 *     description: Accepts a message and confirms it was received
 *     tags:
 *       - Messages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageRequest'
 *           examples:
 *             example1:
 *               summary: Simple message
 *               value:
 *                 content: "Hello, this is a test message"
 *                 role: "user"
 *             example2:
 *               summary: Using alternative field
 *               value:
 *                 text: "Another test message"
 *                 role: "user"
 *     responses:
 *       201:
 *         description: Message received successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - missing message content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/api/messages', async (req, res) => {
  try {
    // Log request
    console.log('POST /api/messages request received');
    
    // Check if message content is provided
    if (!req.body.content && !req.body.text && !req.body.message) {
      return res.status(400).json({
        success: false,
        error: "Please provide message content"
      });
    }
    
    // Prepare message object with consistent structure
    const messageData = {
      content: req.body.content || req.body.text || req.body.message,
      role: req.body.role || "user",
      timestamp: new Date().toISOString()
    };
    
    // Add message using the chat service
    const savedMessage = await chatService.addMessage(messageData);
    
    // Return confirmation
    res.status(201).json({
      success: true,
      message: "Message received successfully",
      data: savedMessage
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      error: "Server error while saving message"
    });
  }
});

/**
 * @openapi
 * /api/messages:
 *   delete:
 *     summary: Delete all messages
 *     description: Clears all messages from storage
 *     tags:
 *       - Messages
 *     responses:
 *       200:
 *         description: All messages cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.delete('/api/messages', async (req, res) => {
  try {
    // Log request
    console.log('DELETE /api/messages request received');
    
    // Clear all messages and get the updated messages list with initial welcome message
    const updatedMessages = await chatService.clearAllMessages();
    
    // Return confirmation with the updated messages
    res.status(200).json({
      success: true,
      message: "All messages cleared successfully",
      data: updatedMessages
    });
  } catch (error) {
    console.error('Error clearing messages:', error);
    res.status(500).json({
      success: false,
      error: "Server error while clearing messages"
    });
  }
});

/**
 * @openapi
 * /api/chat:
 *   post:
 *     summary: Send message to LLM
 *     description: Sends a message to the OpenAI API and returns the response
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *           examples:
 *             example1:
 *               summary: Chat message
 *               value:
 *                 content: "What is the weather like today?"
 *                 role: "user"
 *     responses:
 *       200:
 *         description: LLM response received successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - missing message content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error communicating with LLM service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/api/chat', async (req, res) => {
  try {
    // Log request
    console.log('POST /api/chat request received');
    
    // Check if message content is provided
    if (!req.body.content && !req.body.message) {
      return res.status(400).json({
        success: false,
        error: "Please provide message content"
      });
    }
    
    // Get message content from either property
    const messageContent = req.body.content || req.body.message;
    const userRole = req.body.role || 'user';
    
    // Process the message using the ChatService
    const response = await chatService.processUserMessage(messageContent, userRole);
    
    // Return the LLM response with consistent structure
    res.status(200).json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Error calling LLM API:', error.message);
    
    // Provide more detailed error message
    let errorMessage = "Error communicating with LLM service";
    if (error.response && error.response.data) {
      errorMessage += `: ${JSON.stringify(error.response.data)}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @openapi
 * /api/requests:
 *   get:
 *     summary: Get all request logs
 *     description: Returns the logs of LLM requests for debugging purposes
 *     tags:
 *       - Debug
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of requests to return
 *     responses:
 *       200:
 *         description: Successfully retrieved request logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/api/requests', async (req, res) => {
  try {
    // Log request
    console.log('GET /api/requests request received');
    
    // Get query parameter for limiting the number of requests
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    
    // Get requests from storage using the storage abstraction
    // Second parameter true means reversed (newest first)
    const requests = await requestStorage.getMessages(limit, true);
    
    // Return the request logs with the same structure as messages endpoint
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error retrieving request logs:', error);
    res.status(500).json({
      success: false,
      error: "Server error while retrieving request logs"
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h1>Messages API is running</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api-docs">API Documentation (Swagger UI)</a></li>
      <li>POST /api/messages - Add a message</li>
      <li>GET /api/messages - Get all messages</li>
      <li>DELETE /api/messages - Clear all messages</li>
      <li>POST /api/chat - Chat with LLM</li>
      <li>GET /api/requests - Get all request logs</li>
    </ul>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
