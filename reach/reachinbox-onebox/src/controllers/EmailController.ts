import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/ElasticsearchService';
import { RagService } from '../services/RagService';
import { logger } from '../utils/logger';

export class EmailController {
  constructor(
    private elasticsearchService: ElasticsearchService,
    private ragService: RagService
  ) {}

  public async getEmails(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;
      const accountId = req.query.account as string;
      const folder = req.query.folder as string;

      const result = await this.elasticsearchService.searchEmails(
        '',
        { accountId, folder },
        page,
        size
      );

      res.json(result);
    } catch (error) {
      logger.error('Error getting emails:', error);
      res.status(500).json({ error: 'Failed to retrieve emails' });
    }
  }

  public async searchEmails(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;
      const accountId = req.query.account as string;
      const folder = req.query.folder as string;

      const result = await this.elasticsearchService.searchEmails(
        query,
        { accountId, folder },
        page,
        size
      );

      res.json(result);
    } catch (error) {
      logger.error('Error searching emails:', error);
      res.status(500).json({ error: 'Failed to search emails' });
    }
  }

  public async getEmailById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const email = await this.elasticsearchService.getEmailById(id);

      if (!email) {
        return res.status(404).json({ error: 'Email not found' });
      }

      res.json(email);
    } catch (error) {
      logger.error(`Error getting email by ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve email' });
    }
  }

  public async suggestReply(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const email = await this.elasticsearchService.getEmailById(id);

      if (!email) {
        return res.status(404).json({ error: 'Email not found' });
      }

      const suggestedReply = await this.ragService.suggestReply(email);
      res.json({ suggestedReply });
    } catch (error) {
      logger.error(`Error suggesting reply for email ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to generate suggested reply' });
    }
  }
}