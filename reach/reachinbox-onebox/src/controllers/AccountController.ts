import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/ElasticsearchService';
import { logger } from '../utils/logger';

export class AccountController {
  constructor(private elasticsearchService: ElasticsearchService) {}

  public async getAccounts(req: Request, res: Response) {
    try {
      const accounts = await this.elasticsearchService.getAccountEmails();
      res.json({ accounts });
    } catch (error) {
      logger.error('Error getting accounts:', error);
      res.status(500).json({ error: 'Failed to retrieve accounts' });
    }
  }
}