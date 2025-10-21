import express from 'express';
import * as path from 'path';

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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

// Mock data for emails
const mockEmails = [
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
    accountId: 'user@example.com',
    folder: 'INBOX',
    messageId: 'msg4',
    subject: 'Partnership opportunity',
    from: 'partner@example.com',
    to: 'user@example.com',
    cc: 'team@example.com',
    bcc: '',
    body: 'We are interested in exploring a potential partnership with your company. Our team has reviewed your product and believes there could be significant synergies between our offerings. Could we schedule a call next week to discuss this further?',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    aiCategory: 'Partnership',
    metadata: {
      read: false,
      flagged: true
    }
  },
  {
    _id: '5',
    accountId: 'user@example.com',
    folder: 'INBOX',
    messageId: 'msg5',
    subject: 'Invoice #INV-2023-456',
    from: 'billing@supplier.com',
    to: 'user@example.com',
    cc: 'accounts@example.com',
    bcc: '',
    body: 'Please find attached the invoice for your recent purchase. Payment is due within 30 days. Thank you for your business.',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    aiCategory: 'Invoice',
    metadata: {
      read: true,
      flagged: false
    }
  },
  {
    _id: '6',
    accountId: 'user@example.com',
    folder: 'INBOX',
    messageId: 'msg6',
    subject: 'Feedback on your presentation',
    from: 'manager@example.com',
    to: 'user@example.com',
    cc: '',
    bcc: '',
    body: 'Great job on yesterday\'s presentation! The client was very impressed with your analysis and the solutions you proposed. Let\'s discuss next steps in our team meeting tomorrow.',
    date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    aiCategory: 'Feedback',
    metadata: {
      read: false,
      flagged: false
    }
  },
  {
    _id: '7',
    accountId: 'user@example.com',
    folder: 'INBOX',
    messageId: 'msg7',
    subject: 'Request for information',
    from: 'prospect2@example.com',
    to: 'user@example.com',
    cc: '',
    bcc: '',
    body: 'I came across your company while researching solutions for our current challenges. Could you please send me more information about your services and pricing options?',
    date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    aiCategory: 'Information Request',
    metadata: {
      read: true,
      flagged: false
    }
  }
];

// API Routes
app.get('/api/emails', (req, res) => {
  console.log('GET /api/emails');
  res.json({ emails: mockEmails });
});

app.get('/api/emails/search', (req, res) => {
  console.log('GET /api/emails/search');
  const query = req.query.q as string || '';
  const filteredEmails = mockEmails.filter(email => 
    email.subject.toLowerCase().includes(query.toLowerCase()) || 
    email.body.toLowerCase().includes(query.toLowerCase())
  );
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
    // Mock suggested reply
    let suggestedReply = "Thank you for your message.";
    if (email.aiCategory === 'Interested') {
      suggestedReply = "Thank you for your interest! I would be happy to schedule a demo.";
    } else if (email.aiCategory === 'Meeting Booked') {
      suggestedReply = "Great! I have confirmed our meeting. Looking forward to speaking with you.";
    }
    res.json({ suggestedReply });
  } else {
    res.status(404).json({ error: 'Email not found' });
  }
});

app.get('/api/accounts', (req, res) => {
  console.log('GET /api/accounts');
  const accounts = [
    {
      id: 'user1',
      email: 'user@example.com',
      unread: 2
    }
  ];
  res.json(accounts);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});