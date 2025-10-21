import { EmailDocument } from '../models/EmailDocument';
export declare class ElasticsearchService {
    private client;
    private readonly INDEX_NAME;
    constructor(elasticsearchUrl: string);
    private initializeIndex;
    indexEmail(email: EmailDocument): Promise<string>;
    updateEmailCategory(id: string, category: EmailDocument['aiCategory']): Promise<void>;
    searchEmails(query: string, filters?: {
        accountId?: string;
        folder?: string;
    }, page?: number, size?: number): Promise<{
        emails: {
            id: string | undefined;
            accountId: string;
            folder: string;
            subject: string;
            body: string;
            from: string;
            to: string[];
            date: Date;
            aiCategory: "Interested" | "Meeting Booked" | "Not Interested" | "Spam" | "Out of Office" | "Uncategorized";
            indexedAt: Date;
        }[];
        total: number;
        page: number;
        size: number;
        pages: number;
    }>;
    getEmailById(id: string): Promise<EmailDocument | null>;
    getAccountEmails(): Promise<string[]>;
}
//# sourceMappingURL=ElasticsearchService.d.ts.map