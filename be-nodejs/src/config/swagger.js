import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Messages API',
      version: '1.0.0',
      description: 'API for managing messages and chat with LLM',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the message'
            },
            content: {
              type: 'string',
              description: 'Content of the message'
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system'],
              description: 'Role of the message sender'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the message was created'
            }
          },
          required: ['content', 'role']
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        MessagesListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            count: {
              type: 'integer',
              description: 'Number of messages returned'
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Message'
              }
            }
          }
        },
        ChatRequest: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Message content to send to LLM'
            },
            message: {
              type: 'string',
              description: 'Alternative field for message content'
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system'],
              default: 'user',
              description: 'Role of the message sender'
            }
          },
          required: ['content']
        },
        MessageRequest: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Message content'
            },
            text: {
              type: 'string',
              description: 'Alternative field for message content'
            },
            message: {
              type: 'string',
              description: 'Alternative field for message content'
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system'],
              default: 'user',
              description: 'Role of the message sender'
            }
          }
        }
      }
    }
  },
  apis: ['./index.js'], // Path to the API files
};

export const specs = swaggerJSDoc(options);
