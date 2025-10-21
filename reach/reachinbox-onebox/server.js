const express = require('express');
const path = require('path');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const EventEmitter = require('events');

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// IMAP Service
class ImapService extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.imap = null;
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls || true,
        tlsOptions: { rejectUnauthorized: false }
      });

      this.imap.once('ready', () => {
        console.log(`IMAP connected for ${this.config.user}`);
        this.connected = true;
        this.setupListeners();
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error(`IMAP error for ${this.config.user}:`, err);
        reject(err);
      });

      this.imap.once('end', () => {
        console.log(`IMAP connection ended for ${this.config.user}`);
        this.connected = false;
      });

      this.imap.connect();
    });
  }

  setupListeners() {
    // Listen for new emails
    this.imap.on('mail', (numNewMsgs) => {
      console.log(`${numNewMsgs} new messages received for ${this.config.user}`);
      this.fetchNewEmails();
    });
  }

  async openInbox() {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(box);
      });
    });
  }

  parseHeader(header) {
    const result = {};
    const lines = header.split('\r\n');
    
    let lastKey = '';
    
    for (const line of lines) {
      if (!line) continue;
      
      // Check if this is a continuation of the previous header
      if (line[0] === ' ' || line[0] === '\t') {
        if (lastKey) {
          result[lastKey] += ' ' + line.trim();
        }
        continue;
      }
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = line.substring(0, colonIndex).toLowerCase().trim();
      const value = line.substring(colonIndex + 1).trim();
      
      result[key] = value;
      lastKey = key;
    }
    
    return result;
  }

  async startIdleMode() {
    if (!this.connected) {
      await this.connect();
    }
    
    await this.openInbox();
    
    console.log(`Starting IDLE mode for ${this.config.user}`);
    
    this.imap.idle();
    
    // IDLE typically times out after 30 minutes, so we need to restart it
    // We'll restart after 29 minutes to be safe
    setTimeout(() => {
      if (this.connected) {
        this.imap.idle(false); // Stop current IDLE
        this.startIdleMode(); // Restart IDLE
      }
    }, 29 * 60 * 1000);
  }
}

// AI Category Service
class AiCategoryService {
  categorizeEmail(email) {
    // Simple rule-based categorization for demo
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();
    const from = email.from.toLowerCase();
    
    if (body.includes('interested') || subject.includes('interested')) {
      return 'Interested';
    } else if (body.includes('meeting') || subject.includes('meeting') || 
               body.includes('schedule') || subject.includes('schedule')) {
      return 'Meeting Booked';
    } else if (body.includes('not interested') || subject.includes('not interested') ||
               body.includes('unsubscribe') || subject.includes('unsubscribe')) {
      return 'Not Interested';
    } else if (from.includes('noreply') || from.includes('no-reply') ||
               body.includes('out of office') || subject.includes('out of office')) {
      return 'Out of Office';
    } else if (body.includes('viagra') || body.includes('lottery') || 
               body.includes('prince') || body.includes('million dollar')) {
      return 'Spam';
    } else {
      return 'Uncategorized';
    }
  }
}

// Webhook Service
class WebhookService {
  constructor() {
    this.webhookUrl = 'https://webhook.site/your-webhook-id';
  }
  
  async sendWebhook(email) {
    try {
      console.log(`Sending webhook notification for email: ${email._id}`);
      // In a real implementation, we would make an HTTP request to the webhook URL
      // For demo purposes, we'll just log it
      console.log(`Webhook payload: ${JSON.stringify({
        event: 'new_interested_email',
        email: {
          id: email._id,
          subject: email.subject,
          from: email.from,
          category: email.aiCategory
        }
      })}`);
      return true;
    } catch (error) {
      console.error('Error sending webhook:', error);
      return false;
    }
  }
}

// RAG Service for AI-powered replies
class RagService {
  constructor() {
    // In a real implementation, this would connect to a vector database
    this.productInfo = [
      "I am applying for a job position.",
      "If the lead is interested, share the meeting booking link: https://cal.com/example"
    ];
  }
  
  suggestReply(email) {
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();
    
    if (email.aiCategory === 'Interested') {
      return "Thank you for your interest! I would be happy to schedule a demo. You can book a slot here: https://cal.com/example";
    } else if (email.aiCategory === 'Meeting Booked') {
      return "Great! I have confirmed our meeting. Looking forward to speaking with you.";
    } else if (body.includes('interview') || subject.includes('interview')) {
      return "Thank you for shortlisting my profile! I'm available for a technical interview. You can book a slot here: https://cal.com/example";
    } else {
      return "Thank you for your message. Please let me know if there's anything I can help with.";
    }
  }
}

// Mock data for emails
let mockEmails = [
  {
    _id: '1',
    accountId: 'user@example.com',
    folder: 'INBOX',
    messageId: 'msg1',
    subject: 'Interested in your product',
    from: 'client@example.com',
    to: 'user@example.com',
    cc: '',
    bcc: '',
    body: 'I would like to learn more about your product. Can we schedule a demo?',
    date: new Date().toISOString(),
    aiCategory: 'Interested',
    metadata: {
      read: false,
      flagged: false
    }
  },
  {
    _id: '2',
    accountId: 'user@example.com',
    folder: 'INBOX',
    messageId: 'msg2',
    subject: 'Meeting confirmation',
    from: 'prospect@example.com',
    to: 'user@example.com',
    cc: '',
    bcc: '',
    body: 'I confirm our meeting for tomorrow at 2pm.',
    date: new Date().toISOString(),
    aiCategory: 'Meeting Booked',
    metadata: {
      read: true,
      flagged: true
    }
  },
  {
    _id: '3',
    accountId: 'user@example.com',
    folder: 'INBOX',
    messageId: 'msg3',
    subject: 'Not interested at this time',
    from: 'noprospect@example.com',
    to: 'user@example.com',
    cc: '',
    bcc: '',
    body: 'Thank you for reaching out, but we are not interested at this time.',
    date: new Date().toISOString(),
    aiCategory: 'Not Interested',
    metadata: {
      read: true,
      flagged: false
    }
  },
  {
    _id: '4',
    accountId: 'recruiter@example.com',
    folder: 'INBOX',
    messageId: 'msg4',
    subject: 'Your resume has been shortlisted',
    from: 'hr@company.com',
    to: 'recruiter@example.com',
    cc: '',
    bcc: '',
    body: 'Hi, Your resume has been shortlisted. When will be a good time for you to attend the technical interview?',
    date: new Date().toISOString(),
    aiCategory: 'Interested',
    metadata: {
      read: false,
      flagged: true
    }
  }
];

// Initialize services
const aiCategoryService = new AiCategoryService();
const webhookService = new WebhookService();
const ragService = new RagService();

// Configure IMAP accounts
const imapAccounts = [
  {
    user: 'user@example.com',
    password: 'password123',
    host: 'imap.example.com',
    port: 993,
    tls: true
  },
  {
    user: 'recruiter@example.com',
    password: 'password456',
    host: 'imap.example.com',
    port: 993,
    tls: true
  }
];

// Create IMAP services
const imapServices = imapAccounts.map(account => new ImapService(account));

// Setup event listeners for new emails
imapServices.forEach(imapService => {
  imapService.on('email', async (email) => {
    // Categorize email
    email.aiCategory = aiCategoryService.categorizeEmail(email);
    
    // Add to mock emails
    mockEmails.push(email);
    
    console.log(`New email received: ${email.subject} (${email.aiCategory})`);
    
    // Send webhook for interested emails
    if (email.aiCategory === 'Interested') {
      await webhookService.sendWebhook(email);
    }
  });
});

// API Routes
app.get('/api/emails', (req, res) => {
  console.log('GET /api/emails');
  const accountId = req.query.accountId;
  const folder = req.query.folder;
  
  let filteredEmails = [...mockEmails];
  
  if (accountId) {
    filteredEmails = filteredEmails.filter(email => email.accountId === accountId);
  }
  
  if (folder) {
    filteredEmails = filteredEmails.filter(email => email.folder === folder);
  }
  
  res.json({ emails: filteredEmails, total: filteredEmails.length });
});

// Simple endpoint for backward compatibility
app.get('/emails', (req, res) => {
  const accountId = req.query.account;
  let filteredEmails = [...mockEmails];
  
  if (accountId) {
    filteredEmails = filteredEmails.filter(email => email.accountId === accountId);
  }
  
  res.json(filteredEmails);
});

app.get('/api/emails/search', (req, res) => {
  console.log('GET /api/emails/search');
  const query = req.query.q || '';
  const accountId = req.query.accountId;
  const folder = req.query.folder;
  
  let filteredEmails = [...mockEmails];
  
  if (accountId) {
    filteredEmails = filteredEmails.filter(email => email.accountId === accountId);
  }
  
  if (folder) {
    filteredEmails = filteredEmails.filter(email => email.folder === folder);
  }
  
  if (query) {
    filteredEmails = filteredEmails.filter(email => 
      email.subject.toLowerCase().includes(query.toLowerCase()) || 
      email.body.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  res.json({ emails: filteredEmails, total: filteredEmails.length });
});

app.get('/api/emails/:id', (req, res) => {
  console.log(`GET /api/emails/${req.params.id}`);
  const email = mockEmails.find(e => e._id === req.params.id);
  if (email) {
    res.json(email);
  } else {
    res.status(404).json({ error: 'Email not found' });
  }
});

app.post('/api/emails/:id/suggest-reply', (req, res) => {
  console.log(`POST /api/emails/${req.params.id}/suggest-reply`);
  const email = mockEmails.find(e => e._id === req.params.id);
  if (email) {
    const suggestedReply = ragService.suggestReply(email);
    res.json({ suggestedReply });
  } else {
    res.status(404).json({ error: 'Email not found' });
  }
});

app.get('/api/accounts', (req, res) => {
  console.log('GET /api/accounts');
  const accounts = imapAccounts.map(account => account.user);
  res.json({ accounts });
});

app.get('/api/categories', (req, res) => {
  console.log('GET /api/categories');
  const categories = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office', 'Uncategorized'];
  res.json({ categories });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // In a real implementation, we would connect to IMAP servers and start IDLE mode
  console.log('IMAP services would connect here in a real implementation');
  /*
  imapServices.forEach(async (imapService) => {
    try {
      await imapService.connect();
      await imapService.startIdleMode();
    } catch (error) {
      console.error('Failed to start IMAP service:', error);
    }
  });
  */
});