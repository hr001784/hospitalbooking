import express from 'express';
import * as dotenv from 'dotenv';
import path from 'path';
import { Client } from '@elastic/elasticsearch';
import { ImapService } from './services/ImapService';
import { ElasticsearchService } from './services/ElasticsearchService';
import { AiCategoryService } from './services/AiCategoryService';
import { WebhookService } from './services/WebhookService';
import { RagService } from './services/RagService';
import { EmailController } from './controllers/EmailController';
import { AccountController } from './controllers/AccountController';
import { createEmailRoutes } from './routes/emailRoutes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize services
const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

const elasticsearchService = new ElasticsearchService(elasticsearchClient);
const aiCategoryService = new AiCategoryService(process.env.GEMINI_API_KEY || '');
const webhookService = new WebhookService(
  process.env.SLACK_WEBHOOK_URL || '',
  process.env.GENERIC_WEBHOOK_URL || ''
);
const ragService = new RagService(
  process.env.QDRANT_URL || 'http://localhost:6333',
  process.env.GEMINI_API_KEY || ''
);

// Initialize controllers
const emailController = new EmailController(elasticsearchService, ragService);
const accountController = new AccountController(elasticsearchService);

// Initialize IMAP service
const imapService = new ImapService({
  user: process.env.IMAP_USER || '',
  password: process.env.IMAP_PASSWORD || '',
  host: process.env.IMAP_HOST || '',
  port: parseInt(process.env.IMAP_PORT || '993', 10),
  tls: process.env.IMAP_TLS === 'true'
}, elasticsearchService, aiCategoryService, webhookService);

// Set up routes
app.use('/api/emails', createEmailRoutes(emailController));
app.get('/api/accounts', accountController.getAccounts.bind(accountController));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Start IMAP service
  imapService.connect()
    .then(() => {
      logger.info('IMAP service connected successfully');
    })
    .catch((error) => {
      logger.error('Failed to connect IMAP service:', error);
    });
});

export default app;