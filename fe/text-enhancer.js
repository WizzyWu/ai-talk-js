// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// DOM Elements
const textInput = document.getElementById('text-input');
const enhanceButton = document.getElementById('enhance-button');
const clearButton = document.getElementById('clear-button');
const resultsSection = document.getElementById('results-section');
const originalTextDisplay = document.getElementById('original-text');
const enhancedTextDisplay = document.getElementById('enhanced-text');
const applyButton = document.getElementById('apply-button');
const dismissButton = document.getElementById('dismiss-button');
const errorSection = document.getElementById('error-section');
const errorText = document.getElementById('error-text');
const errorDismiss = document.getElementById('error-dismiss');

// State
let currentOriginalText = '';
let currentEnhancedText = '';
let isLoading = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    
    // Focus on text input when page loads
    textInput.focus();
});

function setupEventListeners() {
    // Enhance button click
    enhanceButton.addEventListener('click', handleEnhanceText);
    
    // Clear button click
    clearButton.addEventListener('click', handleClearText);
    
    // Apply changes button click
    applyButton.addEventListener('click', handleApplyChanges);
    
    // Dismiss results button click
    dismissButton.addEventListener('click', handleDismissResults);
    
    // Error dismiss button click
    errorDismiss.addEventListener('click', handleDismissError);
    
    // Enter key in textarea (Ctrl+Enter to enhance)
    textInput.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            if (!isLoading && textInput.value.trim()) {
                handleEnhanceText();
            }
        }
    });
    
    // Auto-resize textarea based on content
    textInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.max(this.scrollHeight, 120) + 'px';
    });
}

async function handleEnhanceText() {
    const text = textInput.value.trim();
    
    if (!text) {
        showError('Please enter some text to enhance');
        return;
    }
    
    if (isLoading) {
        return;
    }
    
    try {
        setLoadingState(true);
        hideError();
        hideResults();
        
        const response = await enhanceText(text);
        
        if (response.success) {
            currentOriginalText = response.data.originalText;
            currentEnhancedText = response.data.enhancedText;
            showResults();
        } else {
            showError(response.error || 'Failed to enhance text');
        }
        
    } catch (error) {
        console.error('Error enhancing text:', error);
        showError('Failed to enhance text. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

async function enhanceText(text) {
    try {
        const response = await fetch(`${API_BASE_URL}/enhance-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

function handleClearText() {
    textInput.value = '';
    textInput.style.height = 'auto';
    hideResults();
    hideError();
    textInput.focus();
}

function handleApplyChanges() {
    if (currentEnhancedText) {
        textInput.value = currentEnhancedText;
        textInput.style.height = 'auto';
        textInput.style.height = Math.max(textInput.scrollHeight, 120) + 'px';
        hideResults();
        textInput.focus();
        
        // Show a brief success feedback
        showSuccessFeedback();
    }
}

function handleDismissResults() {
    hideResults();
    textInput.focus();
}

function handleDismissError() {
    hideError();
    textInput.focus();
}

function showResults() {
    originalTextDisplay.textContent = currentOriginalText;
    enhancedTextDisplay.textContent = currentEnhancedText;
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResults() {
    resultsSection.style.display = 'none';
    currentOriginalText = '';
    currentEnhancedText = '';
}

function showError(message) {
    errorText.textContent = message;
    errorSection.style.display = 'block';
    
    // Scroll to error
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    errorSection.style.display = 'none';
}

function setLoadingState(loading) {
    isLoading = loading;
    
    if (loading) {
        enhanceButton.disabled = true;
        enhanceButton.textContent = 'Processing...';
        enhanceButton.classList.add('loading');
    } else {
        enhanceButton.disabled = false;
        enhanceButton.textContent = 'Enhance Text';
        enhanceButton.classList.remove('loading');
    }
}

function showSuccessFeedback() {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-feedback';
    successDiv.innerHTML = '✅ Changes applied successfully!';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
