export interface EmailDocument {
    id: string; // Unique message ID
    accountId: string;
    folder: string; // INBOX, Sent, etc.
    subject: string;
    body: string; // Plain text content
    from: string;
    to: string[];
    date: Date;
    aiCategory: 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office' | 'Uncategorized';
    // Elasticsearch metadata
    indexedAt: Date;
}