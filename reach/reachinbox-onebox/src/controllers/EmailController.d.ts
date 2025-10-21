import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/ElasticsearchService';
import { RagService } from '../services/RagService';
export declare class EmailController {
    private elasticsearchService;
    private ragService;
    constructor(elasticsearchService: ElasticsearchService, ragService: RagService);
    getEmails(req: Request, res: Response): Promise<void>;
    searchEmails(req: Request, res: Response): Promise<void>;
    getEmailById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    suggestReply(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=EmailController.d.ts.map