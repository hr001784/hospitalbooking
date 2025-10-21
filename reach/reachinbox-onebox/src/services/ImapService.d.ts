import { EventEmitter } from 'events';
export declare class ImapService extends EventEmitter {
    private config;
    private imap;
    private isConnected;
    private idleTimer;
    private readonly IDLE_TIMEOUT;
    constructor(config: {
        user: string;
        password: string;
        host: string;
        port: number;
        tls: boolean;
    });
    private setupEventHandlers;
    private onReady;
    private onNewMail;
    private onError;
    private onEnd;
    connect(): void;
    disconnect(): void;
    private openInbox;
    private performInitialSync;
    private fetchEmailBatch;
    private fetchNewEmails;
    private startIdle;
    private resetIdleTimer;
}
//# sourceMappingURL=ImapService.d.ts.map