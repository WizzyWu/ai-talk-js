/**
 * API Configuration parameters
 * This file reads configuration from environment variables
 */
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const apiConfig = {
  openai: {
    apiKey: process.env.LLM_KEY,
    apiUrl: process.env.LLM_API_URL,
    model: process.env.LLM_MODEL,
    additionalModel: process.env.LLM_ADDITIONAL_MODEL
  }
};
