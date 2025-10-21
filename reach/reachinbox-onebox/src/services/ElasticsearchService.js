"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchService = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const EmailDocument_1 = require("../models/EmailDocument");
const logger_1 = require("../utils/logger");
class ElasticsearchService {
    client;
    INDEX_NAME = 'emails';
    constructor(elasticsearchUrl) {
        this.client = new elasticsearch_1.Client({ node: elasticsearchUrl });
        this.initializeIndex();
    }
    async initializeIndex() {
        try {
            const indexExists = await this.client.indices.exists({ index: this.INDEX_NAME });
            if (!indexExists) {
                await this.client.indices.create({
                    index: this.INDEX_NAME,
                    body: {
                        mappings: {
                            properties: {
                                subject: { type: 'text' },
                                body: { type: 'text' },
                                accountId: { type: 'keyword' },
                                folder: { type: 'keyword' },
                                from: { type: 'text' },
                                to: { type: 'text' },
                                date: { type: 'date' },
                                aiCategory: { type: 'keyword' },
                                indexedAt: { type: 'date' }
                            }
                        }
                    }
                });
                logger_1.logger.info(`Created index: ${this.INDEX_NAME}`);
            }
            else {
                logger_1.logger.info(`Index ${this.INDEX_NAME} already exists`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error initializing Elasticsearch index:', error);
            throw error;
        }
    }
    async indexEmail(email) {
        try {
            const result = await this.client.index({
                index: this.INDEX_NAME,
                id: email.id,
                body: email
            });
            logger_1.logger.info(`Indexed email with ID: ${email.id}`);
            return result._id;
        }
        catch (error) {
            logger_1.logger.error(`Error indexing email with ID ${email.id}:`, error);
            throw error;
        }
    }
    async updateEmailCategory(id, category) {
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
            logger_1.logger.info(`Updated email ${id} category to: ${category}`);
        }
        catch (error) {
            logger_1.logger.error(`Error updating email ${id} category:`, error);
            throw error;
        }
    }
    async searchEmails(query, filters = {}, page = 1, size = 10) {
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
            const total = result.hits.total;
            const emails = result.hits.hits.map(hit => ({
                ...hit._source,
                id: hit._id
            }));
            return {
                emails,
                total: total.value,
                page,
                size,
                pages: Math.ceil(total.value / size)
            };
        }
        catch (error) {
            logger_1.logger.error('Error searching emails:', error);
            throw error;
        }
    }
    async getEmailById(id) {
        try {
            const result = await this.client.get({
                index: this.INDEX_NAME,
                id
            });
            if (result.found) {
                return {
                    ...result._source,
                    id: result._id
                };
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error getting email with ID ${id}:`, error);
            return null;
        }
    }
    async getAccountEmails() {
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
            return buckets.map((bucket) => bucket.key);
        }
        catch (error) {
            logger_1.logger.error('Error getting account emails:', error);
            return [];
        }
    }
}
exports.ElasticsearchService = ElasticsearchService;
//# sourceMappingURL=ElasticsearchService.js.map