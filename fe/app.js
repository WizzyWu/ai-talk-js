// Constants
const API_BASE_URL = 'http://localhost:3001/api';
const MESSAGES_ENDPOINT = `${API_BASE_URL}/messages`;
const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;

// DOM Elements
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const clearButton = document.getElementById('clear-button');

// DOM Elements for Debug Modal
const debugButton = document.getElementById('debug-button');
const debugModal = document.getElementById('debug-modal');
const closeModal = document.querySelector('.close-modal');
const requestsContainer = document.getElementById('requests-container');

// API Endpoint for requests
const REQUESTS_ENDPOINT = `${API_BASE_URL}/requests`;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load existing messages when the page loads
    loadMessages();
    
    // Send message when button is clicked
    sendButton.addEventListener('click', sendMessage);
    
    // Send message when Enter is pressed (but allow shift+enter for new lines)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Clear messages when clear button is clicked
    clearButton.addEventListener('click', clearMessages);
    
    // Open debug modal when debug button is clicked
    debugButton.addEventListener('click', openDebugModal);
    
    // Close modal when X is clicked
    closeModal.addEventListener('click', closeDebugModal);
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === debugModal) {
            closeDebugModal();
        }
    });
});

// Function to load all messages from the server
async function loadMessages() {
    try {
        showLoading();
        const response = await fetch(MESSAGES_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        const data = await response.json();
        
        if (data.success) {
            displayMessages(data.data);
        } else {
            showError('Failed to load messages');
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showError('Could not connect to server');
    } finally {
        hideLoading();
    }
}

// Function to display messages in the UI
function displayMessages(messages) {
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No messages yet. Start the conversation!';
        messagesContainer.appendChild(emptyMessage);
        return;
    }
    
    messages.forEach(message => {
        // Normalize message format
        let role = 'user';
        let content = '';
        let timestamp = message.timestamp;
        
        if (message.role && message.content) {
            // Already using the correct format
            role = message.role;
            content = message.content;
        } else if (message.sender) {
            // Convert old format messages from messages API
            role = message.sender === 'Anonymous' ? 'user' : message.sender;
            content = message.text || '';
        } else if (message.text) {
            // Handle legacy format
            role = 'user';
            content = message.text;
        }
        
        if (content) {
            const messageElement = createMessageElement(content, role, timestamp);
            messagesContainer.appendChild(messageElement);
        }
    });
    
    // Scroll to bottom to see the latest message
    scrollToBottom();
}

// Function to create a message element
function createMessageElement(content, role, timestampStr) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${role}-container`;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}-message`;
    
    // Use innerHTML instead of textContent for assistant messages to render HTML
    if (role === 'assistant') {
        messageElement.innerHTML = content;
    } else {
        messageElement.textContent = content;
    }
    
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    
    // Use provided timestamp or current time
    let messageTime;
    if (timestampStr) {
        try {
            messageTime = new Date(timestampStr).toLocaleTimeString();
        } catch (e) {
            messageTime = new Date().toLocaleTimeString();
        }
    } else {
        messageTime = new Date().toLocaleTimeString();
    }
    
    timestamp.textContent = messageTime;
    
    messageElement.appendChild(timestamp);
    messageContainer.appendChild(messageElement);
    
    return messageContainer;
}

// Function to send a message
async function sendMessage() {
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        return;
    }
    
    // Add user message to UI immediately with the consistent format
    const timestamp = new Date().toISOString();
    const userMessageElement = createMessageElement(messageText, 'user', timestamp);
    const userMessageId = 'user-message-' + Date.now(); // Add an id to easily find this message later
    userMessageElement.id = userMessageId;
    messagesContainer.appendChild(userMessageElement);
    scrollToBottom();
    
    // Clear input field
    messageInput.value = '';
    
    try {
        // Show loading indicator
        showTypingIndicator();
        
        console.log('Sending request to chat endpoint:', messageText);
        
        // Send message to chat endpoint
        const response = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
                content: messageText,
                role: 'user',
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', response.status, errorText);
            throw new Error(`API error: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        if (data.success) {
            // Add assistant response to UI with the consistent format
            const response = data.data;
            const content = response.content;
            const role = response.role || 'assistant';
            const timestamp = response.timestamp || new Date().toISOString();
            
            // Check if this is a security failure
            if (response.securityCheckFailed) {
                showSecurityWarning();
                // Highlight the last user message with pink background
                highlightLastUserMessageAsSecurity();
            } else {
                const assistantMessageElement = createMessageElement(content, role, timestamp);
                messagesContainer.appendChild(assistantMessageElement);
                scrollToBottom();
            }
        } else {
            showError(`Failed to get response: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Could not connect to server');
    } finally {
        hideTypingIndicator();
    }
}

// Helper Functions
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading';
    loader.id = 'loading-indicator';
    loader.textContent = 'Loading messages...';
    messagesContainer.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.remove();
    }
}

function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message-container assistant-container';
    typingIndicator.id = 'typing-indicator';
    
    const indicatorMessage = document.createElement('div');
    indicatorMessage.className = 'message assistant-message';
    indicatorMessage.textContent = 'AI is typing...';
    
    typingIndicator.appendChild(indicatorMessage);
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Function to clear all messages
async function clearMessages() {
    if (!confirm('Are you sure you want to clear all messages?')) {
        return;
    }
    
    try {
        const response = await fetch(MESSAGES_ENDPOINT, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // If we received updated messages with the initial welcome message, display them
            if (data.data && Array.isArray(data.data)) {
                displayMessages(data.data);
            } else {
                // Fallback to empty state if no messages were returned
                messagesContainer.innerHTML = '';
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = 'No messages yet. Start the conversation!';
                messagesContainer.appendChild(emptyMessage);
            }
        } else {
            showError('Failed to clear messages');
        }
    } catch (error) {
        console.error('Error clearing messages:', error);
        showError('Could not connect to server');
    }
}

function showError(message) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    
    messagesContainer.appendChild(errorMessage);
    setTimeout(() => {
        errorMessage.remove();
    }, 5000);
}

// Function to show security warning
function showSecurityWarning() {
    const securityWarning = document.createElement('div');
    securityWarning.className = 'security-warning';
    securityWarning.innerHTML = 'It seems you are trying to manipulate the chatbot in an inappropriate way. Your last message will not be considered. <br><br>If you believe this happened by mistake, please rephrase your last message.';
    
    messagesContainer.appendChild(securityWarning);
    scrollToBottom();
}

// Function to highlight the last user message with pink background
function highlightLastUserMessageAsSecurity() {
    // Find all user message containers
    const userMessageContainers = document.querySelectorAll('.user-container');
    
    // If there are any user messages, get the last one
    if (userMessageContainers.length > 0) {
        const lastUserMessageContainer = userMessageContainers[userMessageContainers.length - 1];
        const lastUserMessage = lastUserMessageContainer.querySelector('.user-message');
        
        // Add security-flagged class to the message
        if (lastUserMessage) {
            lastUserMessage.classList.add('security-flagged');
        }
    }
}

// Debug modal functions
function openDebugModal() {
    debugModal.style.display = 'block';
    loadRequestLogs();
}

function closeDebugModal() {
    debugModal.style.display = 'none';
}

// Function to load request logs from the server
async function loadRequestLogs() {
    try {
        requestsContainer.innerHTML = '<div class="loading">Loading requests...</div>';
        
        const response = await fetch(REQUESTS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayRequestLogs(data.data);
        } else {
            requestsContainer.innerHTML = '<div class="error-message">Failed to load request logs</div>';
        }
    } catch (error) {
        console.error('Error loading request logs:', error);
        requestsContainer.innerHTML = '<div class="error-message">Could not connect to server</div>';
    }
}

// Function to display request logs in the debug modal
function displayRequestLogs(requests) {
    if (!requests || requests.length === 0) {
        requestsContainer.innerHTML = '<div class="empty-message">No request logs available</div>';
        return;
    }
    
    requestsContainer.innerHTML = '';
    
    requests.forEach((request, index) => {
        const requestElement = createRequestElement(request, index);
        requestsContainer.appendChild(requestElement);
    });
}

// Function to create a request element (spoiler)
function createRequestElement(request, index) {
    const requestSpoiler = document.createElement('div');
    requestSpoiler.className = 'request-spoiler';
    
    // Get a title for the request
    let title = 'LLM API Request';
    if (request.messages && Array.isArray(request.messages)) {
        // Try to get the user message content to display as title
        const userMessage = request.messages.find(msg => msg.role === 'user');
        if (userMessage && userMessage.content) {
            // Truncate long messages
            title = userMessage.content.length > 50 
                ? userMessage.content.substring(0, 50) + '...' 
                : userMessage.content;
        }
    } else if (request.model) {
        title = `Request to ${request.model}`;
    }
    
    // Create header
    const requestHeader = document.createElement('div');
    requestHeader.className = 'request-header';
    requestHeader.onclick = () => toggleRequestContent(index);
    
    const requestTitle = document.createElement('div');
    requestTitle.className = 'request-title';
    requestTitle.textContent = title;
    
    const requestTimestamp = document.createElement('div');
    requestTimestamp.className = 'request-timestamp';
    requestTimestamp.textContent = request.timestamp 
        ? new Date(request.timestamp).toLocaleString()
        : 'Unknown time';
    
    requestHeader.appendChild(requestTitle);
    requestHeader.appendChild(requestTimestamp);
    
    // Create content
    const requestContent = document.createElement('div');
    requestContent.className = 'request-content';
    requestContent.id = `request-content-${index}`;
    
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(request, null, 2);
    
    requestContent.appendChild(pre);
    
    // Add header and content to spoiler
    requestSpoiler.appendChild(requestHeader);
    requestSpoiler.appendChild(requestContent);
    
    return requestSpoiler;
}

// Function to toggle request content visibility
function toggleRequestContent(index) {
    const content = document.getElementById(`request-content-${index}`);
    content.classList.toggle('active');
}
