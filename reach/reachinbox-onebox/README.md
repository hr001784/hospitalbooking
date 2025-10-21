# ReachInbox - Real-Time AI Email Onebox

ReachInbox is a real-time AI-powered email management system that provides intelligent categorization, search capabilities, and suggested replies for your emails.

## Features

- **Real-Time Email Synchronization**: Uses IMAP IDLE for instant email notifications
- **AI-Powered Categorization**: Automatically categorizes emails as "Interested," "Meeting Booked," "Not Interested," "Spam," or "Out of Office"
- **Smart Search**: Full-text search with filtering by account and folder
- **Webhook Integration**: Automatically triggers Slack and custom webhooks for "Interested" emails
- **AI-Suggested Replies**: Generates contextually relevant email replies using RAG (Retrieval Augmented Generation)

## Architecture

The application consists of three main components:

1. **IMAP Sync Service**: Maintains persistent connections to email servers using IMAP IDLE for real-time updates
2. **Persistence Layer**: Uses Elasticsearch for email storage and search, and Qdrant for vector storage
3. **API/Web Integration Layer**: Node.js/Express backend with a simple frontend interface

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (for Elasticsearch and Qdrant)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# IMAP Configuration
IMAP_HOST=imap.example.com
IMAP_PORT=993
IMAP_USER=your-email@example.com
IMAP_PASSWORD=your-password
IMAP_TLS=true

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200

# Qdrant Configuration
QDRANT_URL=http://localhost:6333

# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key

# Webhook Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
GENERIC_WEBHOOK_URL=https://example.com/webhook

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/reachinbox-onebox.git
   cd reachinbox-onebox
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start Elasticsearch and Qdrant using Docker Compose:
   ```
   docker-compose up -d
   ```

4. Build and start the application:
   ```
   npm run build
   npm start
   ```

5. For development mode:
   ```
   npm run dev
   ```

## Deployment to Vercel

This project is configured for deployment on Vercel:

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```
   vercel
   ```

3. Set environment variables in the Vercel dashboard.

## API Endpoints

- `GET /api/emails`: Get all emails with optional filtering
- `GET /api/emails/search`: Search emails with query and filters
- `GET /api/emails/:id`: Get email by ID
- `POST /api/emails/:id/suggest-reply`: Generate a suggested reply for an email
- `GET /api/accounts`: Get all email accounts

## Implementation Details

### Email Synchronization

The IMAP service maintains persistent connections to email servers using the IDLE command, which allows for real-time notifications when new emails arrive.

### Email Categorization

Incoming emails are automatically categorized using the Gemini API. The system analyzes the email content and assigns one of five categories: "Interested," "Meeting Booked," "Not Interested," "Spam," or "Out of Office."

### Suggested Replies

The RAG pipeline for suggested replies works as follows:
1. The original email is converted into a query vector using the Gemini API
2. The vector is used to search for relevant product data in Qdrant
3. Retrieved context is combined with the original email in a prompt for the Gemini API
4. The API generates a contextually relevant reply based on the provided information

## License

ISC