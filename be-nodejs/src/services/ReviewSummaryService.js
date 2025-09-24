import { createLLMService } from './LLMService.js';
import { PromptService } from './PromptService.js';
import { createDebugStorage } from '../storage/DebugStorage.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ReviewSummaryService handles the analysis and summarization of product reviews
 * using AI to generate comprehensive summaries for customers.
 */
class ReviewSummaryService {
    constructor(requestStorage = null) {
        this.promptService = new PromptService();
        this.llmService = this.initializeLLMService(requestStorage);
        
        // Initialize debug storage
        const debugFilePath = path.join(__dirname, '../../review-summarizer-debug.json');
        this.debugStorage = createDebugStorage(debugFilePath);
    }

    /**
     * Initialize LLMService with proper configuration
     * @param {Object} requestStorage - Storage for request logging
     */
    initializeLLMService(requestStorage) {
        if (requestStorage) {
            return createLLMService(requestStorage);
        } else {
            return createLLMService();
        }
    }

    /**
     * Main method to generate a summary from multiple reviews
     * @param {Array} reviews - Array of review objects
     * @returns {Promise<string>} HTML formatted summary
     */
    async generateSummary(reviews) {
        this.validateReviews(reviews);
        
        const formattedReviews = this.formatReviewsForAnalysis(reviews);
        const summaryPrompt = await this.buildSummaryPrompt(formattedReviews);
        const aiResponse = await this.requestAISummary(summaryPrompt);
        
        return this.extractSummaryFromResponse(aiResponse);
    }

    /**
     * Validates that the reviews array is valid and contains proper data
     * @param {Array} reviews - Reviews to validate
     * @throws {Error} If reviews are invalid
     */
    validateReviews(reviews) {
        if (!Array.isArray(reviews)) {
            throw new Error('Reviews must be an array');
        }
        
        if (reviews.length === 0) {
            throw new Error('At least one review is required');
        }

        const invalidReview = reviews.find(review => 
            !review.text || 
            typeof review.text !== 'string' || 
            !Number.isInteger(review.rating) || 
            review.rating < 1 || 
            review.rating > 5
        );

        if (invalidReview) {
            throw new Error('All reviews must have valid text and rating (1-5)');
        }
    }

    /**
     * Formats reviews into a structured text format for AI analysis
     * @param {Array} reviews - Array of review objects
     * @returns {string} Formatted reviews text
     */
    formatReviewsForAnalysis(reviews) {
        return reviews.map((review, index) => {
            const sentiment = review.sentiment ? ` (${review.sentiment})` : '';
            return `Review ${index + 1} - Rating: ${review.rating}/5${sentiment}\n"${review.text}"\n`;
        }).join('\n');
    }

    /**
     * Builds the complete prompt for AI summary generation
     * @param {string} formattedReviews - Formatted reviews text
     * @returns {Promise<string>} Complete prompt for AI
     */
    async buildSummaryPrompt(formattedReviews) {
        const basePrompt = await this.promptService.loadPrompt('review-summary.prompt.xml');
        return `${basePrompt}\n\n${formattedReviews}`;
    }

    /**
     * Sends the prompt to AI service and gets the summary response
     * @param {string} prompt - Complete prompt for summarization
     * @returns {Promise<string>} AI response containing the summary
     */
    async requestAISummary(prompt) {
        if (!this.llmService) {
            throw new Error('LLM service not initialized');
        }

        try {
            // Format the prompt as messages for the LLM service
            const messages = [
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const response = await this.llmService.sendMessage(messages);
            
            // Store debug information
            await this.debugStorage.storeDebugInfo({
                endpoint: '/api/summarize-reviews',
                request: {
                    messages: messages,
                    prompt: prompt
                },
                response: response
            });
            
            // Validate response structure
            if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
                throw new Error('Invalid response from AI service');
            }
            
            // Extract content from the response
            const content = response.choices[0].message.content;
            
            if (!content || typeof content !== 'string') {
                throw new Error('No valid content in AI response');
            }
            
            return content;
        } catch (error) {
            console.error('Error requesting AI summary:', error);
            throw new Error(`Failed to generate summary: ${error.message}`);
        }
    }

    /**
     * Extracts and cleans the summary from AI response
     * @param {string} aiResponse - Raw AI response
     * @returns {string} Clean HTML summary
     */
    extractSummaryFromResponse(aiResponse) {
        // Remove any markdown code blocks if present
        let summary = aiResponse.replace(/```html\n?/g, '').replace(/```\n?/g, '');
        
        // Trim whitespace
        summary = summary.trim();
        
        if (!summary) {
            throw new Error('Empty summary received from AI');
        }
        
        return summary;
    }

    /**
     * Analyzes review distribution for additional insights
     * @param {Array} reviews - Array of review objects
     * @returns {Object} Analysis object with rating distribution and sentiment counts
     */
    analyzeReviewDistribution(reviews) {
        const distribution = {
            totalReviews: reviews.length,
            averageRating: 0,
            ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            sentimentCounts: { positive: 0, negative: 0, mixed: 0 }
        };

        let totalRating = 0;

        reviews.forEach(review => {
            totalRating += review.rating;
            distribution.ratingCounts[review.rating]++;
            
            if (review.sentiment) {
                distribution.sentimentCounts[review.sentiment]++;
            }
        });

        distribution.averageRating = Number((totalRating / reviews.length).toFixed(1));
        
        return distribution;
    }

    /**
     * Filters reviews by minimum rating threshold
     * @param {Array} reviews - Array of review objects
     * @param {number} minRating - Minimum rating to include (1-5)
     * @returns {Array} Filtered reviews
     */
    filterReviewsByRating(reviews, minRating) {
        this.validateReviews(reviews);
        
        if (!Number.isInteger(minRating) || minRating < 1 || minRating > 5) {
            throw new Error('Minimum rating must be an integer between 1 and 5');
        }
        
        return reviews.filter(review => review.rating >= minRating);
    }

    /**
     * Filters reviews by sentiment type
     * @param {Array} reviews - Array of review objects
     * @param {string} sentimentType - Type of sentiment ('positive', 'negative', 'mixed')
     * @returns {Array} Filtered reviews
     */
    filterReviewsBySentiment(reviews, sentimentType) {
        this.validateReviews(reviews);
        
        const validSentiments = ['positive', 'negative', 'mixed'];
        if (!validSentiments.includes(sentimentType)) {
            throw new Error(`Sentiment type must be one of: ${validSentiments.join(', ')}`);
        }
        
        return reviews.filter(review => review.sentiment === sentimentType);
    }
}

/**
 * Factory function to create a ReviewSummaryService instance
 * @param {MessageStorageInterface} requestStorage - Storage for request logging
 * @returns {ReviewSummaryService} Configured service instance
 */
export function createReviewSummaryService(requestStorage) {
    return new ReviewSummaryService(requestStorage);
}

export { ReviewSummaryService };
