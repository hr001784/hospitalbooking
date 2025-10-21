import { Client } from '@elastic/elasticsearch';
import { EmailDocument } from '../models/EmailDocument';
import { logger } from '../utils/logger';

export class ElasticsearchService {
  private client: Client;
  private readonly INDEX_NAME = 'emails';

  constructor(client: Client) {
    this.client = client;
    this.initIndex();
  }

  private async initIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.INDEX_NAME
      });

      if (!indexExists.body) {
        await this.client.indices.create({
          index: this.INDEX_NAME,
          body: {
            mappings: {
              properties: {
                accountId: { type: 'keyword' },
                folder: { type: 'keyword' },
                messageId: { type: 'keyword' },
                subject: { type: 'text' },
                from: { type: 'text' },
                to: { type: 'text' },
                cc: { type: 'text' },
                bcc: { type: 'text' },
                body: { type: 'text' },
                date: { type: 'date' },
                aiCategory: { type: 'keyword' },
                metadata: {
                  properties: {
                    read: { type: 'boolean' },
                    flagged: { type: 'boolean' }
                  }
                }
              }
            }
          }
        });
        logger.info('Elasticsearch index created');
      } else {
        logger.info('Elasticsearch index already exists');
      }
    } catch (error) {
      logger.error('Error initializing Elasticsearch index:', error);
    }
  }

  public async indexEmail(email: EmailDocument): Promise<string> {
    try {
      const result = await this.client.index({
        index: this.INDEX_NAME,
        id: email.id,
        body: email
      });
      
      logger.info(`Indexed email with ID: ${email.id}`);
      return result._id;
    } catch (error) {
      logger.error(`Error indexing email with ID ${email.id}:`, error);
      throw error;
    }
  }

  public async updateEmailCategory(id: string, category: EmailDocument['aiCategory']): Promise<void> {
    try {
      await this.client.update({
        index: this.INDEX_NAME,
        id: id,
        body: {
          doc: {
            aiCategory: category
          }
        }
      });
      
      logger.info(`Updated email ${id} category to: ${category}`);
    } catch (error) {
      logger.error(`Error updating email ${id} category:`, error);
      throw error;
    }
  }

  public async searchEmails(query: string, filters: { accountId?: string; folder?: string } = {}, page = 1, size = 10) {
    try {
      const must = [];
      const filter = [];
      
      // Add text search if query is provided
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['subject', 'body']
          }
        });
      }
      
      // Add filters
      if (filters.accountId) {
        filter.push({ term: { accountId: filters.accountId } });
      }
      
      if (filters.folder) {
        filter.push({ term: { folder: filters.folder } });
      }
      
      const result = await this.client.search({
        index: this.INDEX_NAME,
        body: {
          query: {
            bool: {
              must,
              filter
            }
          },
          sort: [
            { date: { order: 'desc' } }
          ],
          from: (page - 1) * size,
          size
        }
      });
      
      const total = result.hits.total as { value: number };
      const emails = result.hits.hits.map(hit => ({
        ...hit._source as EmailDocument,
        id: hit._id
      }));
      
      return {
        emails,
        total: total.value,
        page,
        size,
        pages: Math.ceil(total.value / size)
      };
    } catch (error) {
      logger.error('Error searching emails:', error);
      throw error;
    }
  }

  public async getEmailById(id: string): Promise<EmailDocument | null> {
    try {
      const result = await this.client.get({
        index: this.INDEX_NAME,
        id
      });
      
      if (result.found) {
        return {
          ...result._source as EmailDocument,
          id: result._id
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`Error getting email with ID ${id}:`, error);
      return null;
    }
  }

  public async getAccountEmails(): Promise<string[]> {
    try {
      const result = await this.client.search({
        index: this.INDEX_NAME,
        body: {
          size: 0,
          aggs: {
            accounts: {
              terms: {
                field: 'accountId',
                size: 100
              }
            }
          }
        }
      });
      
      const buckets = result.aggregations?.accounts?.buckets || [];
      return buckets.map((bucket: any) => bucket.key);
    } catch (error) {
      logger.error('Error getting account emails:', error);
      return [];
    }
  }
}