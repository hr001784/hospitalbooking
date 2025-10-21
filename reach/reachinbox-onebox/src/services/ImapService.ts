import * as Imap from 'node-imap';
import { EventEmitter } from 'events';
import { EmailDocument } from '../models/EmailDocument';
import { logger } from '../utils/logger';
import { ElasticsearchService } from './ElasticsearchService';
import { AiCategoryService } from './AiCategoryService';
import { WebhookService } from './WebhookService';

// Add missing parseHeader function
const parseHeader = function(buffer: string) {
  const headers: Record<string, string[]> = {};
  const lines = buffer.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue;
    
    const match = line.match(/^([^:]+):\s*(.*)/);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2];
      
      if (!headers[key]) {
        headers[key] = [];
      }
      
      headers[key].push(value);
    }
  }
  
  return headers;
};

export class ImapService extends EventEmitter {
  private imap: Imap;
  private isConnected: boolean = false;
  private idleTimer: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT = 29 * 60 * 1000; // 29 minutes in milliseconds

  constructor(
    private config: {
      user: string;
      password: string;
      host: string;
      port: number;
      tls: boolean;
    }
  ) {
    super();
    this.imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
      keepalive: true,
      authTimeout: 30000
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.imap.on('ready', () => this.onReady());
    this.imap.on('mail', (numNewMsgs: number) => this.onNewMail(numNewMsgs));
    this.imap.on('error', (err: Error) => this.onError(err));
    this.imap.on('end', () => this.onEnd());
  }

  private onReady() {
    logger.info('IMAP connection ready');
    this.isConnected = true;
    this.openInbox();
  }

  private onNewMail(numNewMsgs: number) {
    logger.info(`New mail arrived: ${numNewMsgs} new messages`);
    // Fetch only the new messages
    this.fetchNewEmails(numNewMsgs);
  }

  private onError(err: Error) {
    logger.error('IMAP connection error:', err);
    this.isConnected = false;
    this.resetIdleTimer();
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, 10000); // 10 seconds delay
  }

  private onEnd() {
    logger.info('IMAP connection ended');
    this.isConnected = false;
    this.resetIdleTimer();
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, 10000); // 10 seconds delay
  }

  public connect() {
    logger.info('Connecting to IMAP server...');
    this.imap.connect();
  }

  public disconnect() {
    logger.info('Disconnecting from IMAP server...');
    this.resetIdleTimer();
    if (this.isConnected) {
      this.imap.end();
    }
  }

  private openInbox() {
    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        logger.error('Error opening inbox:', err);
        return;
      }
      
      logger.info('Inbox opened successfully');
      
      // Perform initial sync to get recent emails
      this.performInitialSync();
      
      // Start IDLE mode
      this.startIdle();
    });
  }

  private performInitialSync() {
    // Get emails from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const searchCriteria = [
      ['SINCE', thirtyDaysAgo.toISOString().split('T')[0]]
    ];
    
    this.imap.search(searchCriteria, (err, results) => {
      if (err) {
        logger.error('Error searching emails:', err);
        return;
      }
      
      if (results.length === 0) {
        logger.info('No emails found in the last 30 days');
        return;
      }
      
      logger.info(`Found ${results.length} emails in the last 30 days`);
      
      // Fetch emails in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        this.fetchEmailBatch(batch);
      }
    });
  }

  private fetchEmailBatch(uids: number[]) {
    const fetch = this.imap.fetch(uids, {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
      struct: true
    });
    
    fetch.on('message', (msg, seqno) => {
      const email: Partial<EmailDocument> = {
        accountId: this.config.user,
        folder: 'INBOX',
        aiCategory: 'Uncategorized',
        indexedAt: new Date()
      };
      
      msg.on('body', (stream, info) => {
        let buffer = '';
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });
        
        stream.on('end', () => {
          if (info.which.includes('HEADER')) {
            const header = Imap.parseHeader(buffer);
            email.subject = header.subject?.[0] || '';
            email.from = header.from?.[0] || '';
            email.to = header.to || [];
            email.date = header.date ? new Date(header.date[0]) : new Date();
          } else {
            email.body = buffer;
          }
        });
      });
      
      msg.once('attributes', (attrs) => {
        email.id = attrs.uid.toString();
      });
      
      msg.once('end', () => {
        // Emit the email when all parts have been processed
        if (email.id && email.subject && email.from) {
          this.emit('email', email as EmailDocument);
        }
      });
    });
    
    fetch.once('error', (err) => {
      logger.error('Error fetching email batch:', err);
    });
  }

  private fetchNewEmails(count: number) {
    // Get the last 'count' emails
    const fetch = this.imap.seq.fetch(`${Math.max(1, this.imap._box.messages.total - count + 1)}:*`, {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
      struct: true
    });
    
    fetch.on('message', (msg, seqno) => {
      const email: Partial<EmailDocument> = {
        accountId: this.config.user,
        folder: 'INBOX',
        aiCategory: 'Uncategorized',
        indexedAt: new Date()
      };
      
      msg.on('body', (stream, info) => {
        let buffer = '';
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });
        
        stream.on('end', () => {
          if (info.which.includes('HEADER')) {
            const header = Imap.parseHeader(buffer);
            email.subject = header.subject?.[0] || '';
            email.from = header.from?.[0] || '';
            email.to = header.to || [];
            email.date = header.date ? new Date(header.date[0]) : new Date();
          } else {
            email.body = buffer;
          }
        });
      });
      
      msg.once('attributes', (attrs) => {
        email.id = attrs.uid.toString();
      });
      
      msg.once('end', () => {
        // Emit the email when all parts have been processed
        if (email.id && email.subject && email.from) {
          this.emit('email', email as EmailDocument);
        }
      });
    });
    
    fetch.once('error', (err) => {
      logger.error('Error fetching new emails:', err);
    });
    
    fetch.once('end', () => {
      // Restart IDLE mode after fetching new emails
      this.startIdle();
    });
  }

  private startIdle() {
    if (!this.isConnected) return;
    
    this.imap.idle();
    logger.info('IMAP IDLE mode started');
    
    // Set a timer to restart IDLE before the server timeout
    this.resetIdleTimer();
    this.idleTimer = setTimeout(() => {
      logger.info('Restarting IDLE mode due to timeout');
      if (this.isConnected) {
        this.imap.idle(false); // Stop IDLE
        this.startIdle(); // Restart IDLE
      }
    }, this.IDLE_TIMEOUT);
  }

  private resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
}