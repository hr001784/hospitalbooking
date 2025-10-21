import { EmailDocument } from '../models/EmailDocument';
export declare class AiCategoryService {
    private apiKey;
    private readonly API_URL;
    constructor(apiKey: string);
    categorizeEmail(email: EmailDocument): Promise<EmailDocument['aiCategory']>;
}
//# sourceMappingURL=AiCategoryService.d.ts.map