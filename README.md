# ai-talk-js

Demo project for the talk: "Your First Steps with GenAI - Build a Simple App in JavaScript"

This is a demonstration project that showcases how to build a simple AI-powered chat application using JavaScript. The project consists of:

- **Backend**: Node.js server with Express framework
- **Frontend**: Pure HTML and JavaScript (no frameworks)

## Project Structure

- `be-nodejs/` - Backend Node.js application
- `fe/` - Frontend HTML/CSS/JS files

## Backend Setup

Make sure you have Node.js installed on your system.

1. Navigate to the backend directory:
   ```bash
   cd be-nodejs
   ```

2. Install dependencies:
   ```bash
   npm i
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The backend service will start running on port 3001. You can access:

- **OpenAPI Specification**: [Available through the Swagger UI at the above URL](http://localhost:3001/api-docs/)

## Frontend Setup

To run the UI, simply open the HTML files in your browser:

1. Navigate to the `fe/` directory
2. Open any HTML file in your browser (e.g., `chat.html`)

Currently available:
- `chat.html` - Main chat interface
