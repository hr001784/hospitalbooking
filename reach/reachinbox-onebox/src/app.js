"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const elasticsearch_1 = require("@elastic/elasticsearch");
const ImapService_1 = require("./services/ImapService");
const ElasticsearchService_1 = require("./services/ElasticsearchService");
const AiCategoryService_1 = require("./services/AiCategoryService");
const WebhookService_1 = require("./services/WebhookService");
const RagService_1 = require("./services/RagService");
const EmailController_1 = require("./controllers/EmailController");
const AccountController_1 = require("./controllers/AccountController");
const emailRoutes_1 = require("./routes/emailRoutes");
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
app.use(express_1.default.json());
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
const elasticsearchClient = new elasticsearch_1.Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});
const elasticsearchService = new ElasticsearchService_1.ElasticsearchService(elasticsearchClient);
const aiCategoryService = new AiCategoryService_1.AiCategoryService(process.env.GEMINI_API_KEY || '');
const webhookService = new WebhookService_1.WebhookService(process.env.SLACK_WEBHOOK_URL || '', process.env.GENERIC_WEBHOOK_URL || '');
const ragService = new RagService_1.RagService(process.env.QDRANT_URL || 'http://localhost:6333', process.env.GEMINI_API_KEY || '');
// Initialize controllers
const emailController = new EmailController_1.EmailController(elasticsearchService, ragService);
const accountController = new AccountController_1.AccountController(elasticsearchService);
// Initialize IMAP service
const imapService = new ImapService_1.ImapService({
    user: process.env.IMAP_USER || '',
    password: process.env.IMAP_PASSWORD || '',
    host: process.env.IMAP_HOST || '',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    tls: process.env.IMAP_TLS === 'true'
}, elasticsearchService, aiCategoryService, webhookService);
// Set up routes
app.use('/api/emails', (0, emailRoutes_1.createEmailRoutes)(emailController));
app.get('/api/accounts', accountController.getAccounts.bind(accountController));
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
    });
}
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger_1.logger.info(`Server running on port ${PORT}`);
    // Start IMAP service
    imapService.connect()
        .then(() => {
        logger_1.logger.info('IMAP service connected successfully');
    })
        .catch((error) => {
        logger_1.logger.error('Failed to connect IMAP service:', error);
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map