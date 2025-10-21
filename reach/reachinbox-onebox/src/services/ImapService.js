"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImapService = void 0;
const Imap = __importStar(require("node-imap"));
const mailparser_1 = require("mailparser");
const events_1 = require("events");
const EmailDocument_1 = require("../models/EmailDocument");
const logger_1 = require("../utils/logger");
class ImapService extends events_1.EventEmitter {
    config;
    imap;
    isConnected = false;
    idleTimer = null;
    IDLE_TIMEOUT = 29 * 60 * 1000; // 29 minutes in milliseconds
    constructor(config) {
        super();
        this.config = config;
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
    setupEventHandlers() {
        this.imap.on('ready', () => this.onReady());
        this.imap.on('mail', (numNewMsgs) => this.onNewMail(numNewMsgs));
        this.imap.on('error', (err) => this.onError(err));
        this.imap.on('end', () => this.onEnd());
    }
    onReady() {
        logger_1.logger.info('IMAP connection ready');
        this.isConnected = true;
        this.openInbox();
    }
    onNewMail(numNewMsgs) {
        logger_1.logger.info(`New mail arrived: ${numNewMsgs} new messages`);
        // Fetch only the new messages
        this.fetchNewEmails(numNewMsgs);
    }
    onError(err) {
        logger_1.logger.error('IMAP connection error:', err);
        this.isConnected = false;
        this.resetIdleTimer();
        // Attempt to reconnect after a delay
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, 10000); // 10 seconds delay
    }
    onEnd() {
        logger_1.logger.info('IMAP connection ended');
        this.isConnected = false;
        this.resetIdleTimer();
        // Attempt to reconnect after a delay
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, 10000); // 10 seconds delay
    }
    connect() {
        logger_1.logger.info('Connecting to IMAP server...');
        this.imap.connect();
    }
    disconnect() {
        logger_1.logger.info('Disconnecting from IMAP server...');
        this.resetIdleTimer();
        if (this.isConnected) {
            this.imap.end();
        }
    }
    openInbox() {
        this.imap.openBox('INBOX', false, (err, box) => {
            if (err) {
                logger_1.logger.error('Error opening inbox:', err);
                return;
            }
            logger_1.logger.info('Inbox opened successfully');
            // Perform initial sync to get recent emails
            this.performInitialSync();
            // Start IDLE mode
            this.startIdle();
        });
    }
    performInitialSync() {
        // Get emails from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const searchCriteria = [
            ['SINCE', thirtyDaysAgo.toISOString().split('T')[0]]
        ];
        this.imap.search(searchCriteria, (err, results) => {
            if (err) {
                logger_1.logger.error('Error searching emails:', err);
                return;
            }
            if (results.length === 0) {
                logger_1.logger.info('No emails found in the last 30 days');
                return;
            }
            logger_1.logger.info(`Found ${results.length} emails in the last 30 days`);
            // Fetch emails in batches to avoid overwhelming the server
            const batchSize = 10;
            for (let i = 0; i < results.length; i += batchSize) {
                const batch = results.slice(i, i + batchSize);
                this.fetchEmailBatch(batch);
            }
        });
    }
    fetchEmailBatch(uids) {
        const fetch = this.imap.fetch(uids, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
        });
        fetch.on('message', (msg, seqno) => {
            const email = {
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
                    }
                    else {
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
                    this.emit('email', email);
                }
            });
        });
        fetch.once('error', (err) => {
            logger_1.logger.error('Error fetching email batch:', err);
        });
    }
    fetchNewEmails(count) {
        // Get the last 'count' emails
        const fetch = this.imap.seq.fetch(`${Math.max(1, this.imap._box.messages.total - count + 1)}:*`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
        });
        fetch.on('message', (msg, seqno) => {
            const email = {
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
                    }
                    else {
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
                    this.emit('email', email);
                }
            });
        });
        fetch.once('error', (err) => {
            logger_1.logger.error('Error fetching new emails:', err);
        });
        fetch.once('end', () => {
            // Restart IDLE mode after fetching new emails
            this.startIdle();
        });
    }
    startIdle() {
        if (!this.isConnected)
            return;
        this.imap.idle();
        logger_1.logger.info('IMAP IDLE mode started');
        // Set a timer to restart IDLE before the server timeout
        this.resetIdleTimer();
        this.idleTimer = setTimeout(() => {
            logger_1.logger.info('Restarting IDLE mode due to timeout');
            if (this.isConnected) {
                this.imap.idle(false); // Stop IDLE
                this.startIdle(); // Restart IDLE
            }
        }, this.IDLE_TIMEOUT);
    }
    resetIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }
}
exports.ImapService = ImapService;
//# sourceMappingURL=ImapService.js.map