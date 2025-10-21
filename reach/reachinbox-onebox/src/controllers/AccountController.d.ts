import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/ElasticsearchService';
export declare class AccountController {
    private elasticsearchService;
    constructor(elasticsearchService: ElasticsearchService);
    getAccounts(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AccountController.d.ts.map