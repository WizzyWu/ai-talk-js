// Sample product reviews data
const sampleReviews = [
    {
        id: 1,
        rating: 5,
        author: "Sarah Johnson",
        date: "2024-03-15",
        text: "Absolutely love this product! The quality is exceptional and it works exactly as described. Fast shipping and great customer service. Would definitely recommend to others.",
        sentiment: "positive"
    },
    {
        id: 2,
        rating: 2,
        author: "Mike Thompson",
        date: "2024-03-10",
        text: "Very disappointed with this purchase. The product arrived damaged and the customer service was unhelpful. It took weeks to get a replacement and even then the quality was poor.",
        sentiment: "negative"
    },
    {
        id: 3,
        rating: 4,
        author: "Emma Wilson",
        date: "2024-03-12",
        text: "Good product overall. The design is nice and it serves its purpose well. However, I found it a bit overpriced for what you get. Delivery was quick though.",
        sentiment: "mixed"
    },
    {
        id: 4,
        rating: 5,
        author: "David Lee",
        date: "2024-03-18",
        text: "Outstanding quality and performance! This has exceeded my expectations in every way. The materials feel premium and the functionality is flawless. Worth every penny.",
        sentiment: "positive"
    },
    {
        id: 5,
        rating: 1,
        author: "Jennifer Brown",
        date: "2024-03-08",
        text: "Terrible experience. The product broke after just one week of normal use. When I contacted support, they were rude and refused to help. Complete waste of money.",
        sentiment: "negative"
    },
    {
        id: 6,
        rating: 3,
        author: "Alex Garcia",
        date: "2024-03-14",
        text: "It's okay, nothing special. Does what it's supposed to do but doesn't stand out from similar products. The price is reasonable but the build quality could be better.",
        sentiment: "mixed"
    },
    {
        id: 7,
        rating: 4,
        author: "Lisa Chen",
        date: "2024-03-16",
        text: "Pretty satisfied with this purchase. The product works well and looks good. Installation was straightforward. Only minor complaint is that it's a bit heavier than expected.",
        sentiment: "mixed"
    },
    {
        id: 8,
        rating: 5,
        author: "Robert Davis",
        date: "2024-03-20",
        text: "Fantastic product! Exactly what I needed and the quality is top-notch. Great value for money and excellent packaging. Will definitely buy from this company again.",
        sentiment: "positive"
    },
    {
        id: 9,
        rating: 3,
        author: "Maria Rodriguez",
        date: "2024-03-11",
        text: "Mixed feelings about this product. It has some great features but also some annoying limitations. For the price, I expected better performance. Customer service was helpful though.",
        sentiment: "mixed"
    },
    {
        id: 10,
        rating: 4,
        author: "John Miller",
        date: "2024-03-17",
        text: "Good solid product that does the job well. The design is sleek and modern. Setup was easy and it's been reliable so far. Would recommend, though there are cheaper alternatives available.",
        sentiment: "mixed"
    }
];

class ReviewSummarizer {
    constructor() {
        this.init();
    }

    init() {
        this.displayReviews();
        this.attachEventListeners();
    }

    displayReviews() {
        const reviewsContainer = document.getElementById('reviews-container');
        
        const reviewsHTML = sampleReviews.map(review => `
            <div class="review-card ${review.sentiment}">
                <div class="review-header">
                    <div class="review-author">${review.author}</div>
                    <div class="review-rating">${'⭐'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
                </div>
                <div class="review-text">${review.text}</div>
                <div class="review-sentiment ${review.sentiment}">${review.sentiment.toUpperCase()}</div>
            </div>
        `).join('');

        reviewsContainer.innerHTML = reviewsHTML;
    }

    attachEventListeners() {
        const summarizeButton = document.getElementById('summarize-button');
        const debugButton = document.getElementById('debug-button');
        const debugModal = document.getElementById('debug-modal');
        const closeModal = document.querySelector('.close-modal');

        summarizeButton.addEventListener('click', () => this.summarizeReviews());
        debugButton.addEventListener('click', () => this.showDebugInfo());
        closeModal.addEventListener('click', () => this.hideDebugModal());
        
        window.addEventListener('click', (event) => {
            if (event.target === debugModal) {
                this.hideDebugModal();
            }
        });
    }

    async summarizeReviews() {
        const summarizeButton = document.getElementById('summarize-button');
        const summarySection = document.getElementById('summary-section');
        const summaryContainer = document.getElementById('summary-container');

        // Show loading state
        summarizeButton.disabled = true;
        summarizeButton.textContent = 'Summarizing...';
        summarySection.style.display = 'block';
        summaryContainer.innerHTML = '<div class="loading">Generating summary...</div>';

        try {
            const response = await fetch('http://localhost:3001/api/summarize-reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reviews: sampleReviews.map(review => ({
                        rating: review.rating,
                        text: review.text,
                        sentiment: review.sentiment
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.summary) {
                summaryContainer.innerHTML = `
                    <div class="summary-content">
                        ${data.summary}
                    </div>
                `;
            } else {
                throw new Error('No summary received');
            }

        } catch (error) {
            console.error('Error summarizing reviews:', error);
            summaryContainer.innerHTML = `
                <div class="error-message">
                    <h3>Error</h3>
                    <p>Failed to generate summary. Please try again.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        } finally {
            // Reset button state
            summarizeButton.disabled = false;
            summarizeButton.textContent = 'Summarize Reviews';
        }
    }

    // Helper function to strip HTML tags and clean text
    stripHtmlTags(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }

    async showDebugInfo() {
        const debugModal = document.getElementById('debug-modal');
        const requestsContainer = document.getElementById('requests-container');

        debugModal.style.display = 'block';

        try {
            const response = await fetch('http://localhost:3001/api/review-debug');
            const data = await response.json();

            if (data.success && data.debugInfo) {
                const debugInfo = data.debugInfo;
                
                // Clean the response content from HTML tags
                let cleanResponse = { ...debugInfo.response };
                if (cleanResponse.choices && cleanResponse.choices[0] && cleanResponse.choices[0].message) {
                    cleanResponse.choices[0].message.content = this.stripHtmlTags(cleanResponse.choices[0].message.content);
                }
                
                const requestsHTML = `
                    <details class="request-spoiler" open>
                        <summary>Latest Review Summarizer Request - ${new Date(debugInfo.timestamp).toLocaleString()}</summary>
                        <div class="request-details">
                            <h4>Endpoint:</h4>
                            <pre><code>${debugInfo.endpoint}</code></pre>
                            <h4>Request Prompt (includes reviews):</h4>
                            <pre><code>${debugInfo.request.prompt}</code></pre>
                            <h4>AI Response (clean text):</h4>
                            <pre><code>${JSON.stringify(cleanResponse, null, 2)}</code></pre>
                        </div>
                    </details>
                `;

                requestsContainer.innerHTML = requestsHTML;
            } else {
                requestsContainer.innerHTML = '<p>No debug information found. Make a summarization request first.</p>';
            }
        } catch (error) {
            console.error('Error fetching debug info:', error);
            requestsContainer.innerHTML = `<p>Error loading debug info: ${error.message}</p>`;
        }
    }

    hideDebugModal() {
        const debugModal = document.getElementById('debug-modal');
        debugModal.style.display = 'none';
    }
}

// Initialize the review summarizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReviewSummarizer();
});
