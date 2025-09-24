import { LLMService } from './src/services/LLMService.js';
import { apiConfig } from './src/config/apiConfig.js';

// Test the LLMService by making a simple call
async function testLLMService() {
  console.log('Testing LLM Service...');
  
  // Get configuration from apiConfig
  const { apiKey, apiUrl, model } = apiConfig.openai;
  
  const llmService = new LLMService({
    apiKey,
    apiUrl,
    model
  });
  
  try {
    const messages = [
      {
        role: 'user',
        content: 'Hello! Can you give me a brief introduction to Node.js?'
      }
    ];
    
    console.log('Sending request to OpenAI...');
    const response = await llmService.sendMessage(messages);
    
    console.log('LLM Response:');
    console.log(JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error('Error testing LLM service:', error.message);
    return null;
  }
}

// Run the test
testLLMService().then(() => {
  console.log('Test completed');
});
