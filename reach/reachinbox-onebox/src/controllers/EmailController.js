"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const express_1 = require("express");
const ElasticsearchService_1 = require("../services/ElasticsearchService");
const RagService_1 = require("../services/RagService");
const logger_1 = require("../utils/logger");
class EmailController {
    elasticsearchService;
    ragService;
    constructor(elasticsearchService, ragService) {
        this.elasticsearchService = elasticsearchService;
        this.ragService = ragService;
    }
    async getEmails(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const size = parseInt(req.query.size) || 10;
            const accountId = req.query.account;
            const folder = req.query.folder;
            const result = await this.elasticsearchService.searchEmails('', { accountId, folder }, page, size);
            res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Error getting emails:', error);
            res.status(500).json({ error: 'Failed to retrieve emails' });
        }
    }
    async searchEmails(req, res) {
        try {
            const query = req.query.q;
            const page = parseInt(req.query.page) || 1;
            const size = parseInt(req.query.size) || 10;
            const accountId = req.query.account;
            const folder = req.query.folder;
            const result = await this.elasticsearchService.searchEmails(query, { accountId, folder }, page, size);
            res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Error searching emails:', error);
            res.status(500).json({ error: 'Failed to search emails' });
        }
    }
    async getEmailById(req, res) {
        try {
            const id = req.params.id;
            const email = await this.elasticsearchService.getEmailById(id);
            if (!email) {
                return res.status(404).json({ error: 'Email not found' });
            }
            res.json(email);
        }
        catch (error) {
            logger_1.logger.error(`Error getting email by ID ${req.params.id}:`, error);
            res.status(500).json({ error: 'Failed to retrieve email' });
        }
    }
    async suggestReply(req, res) {
        try {
            const id = req.params.id;
            const email = await this.elasticsearchService.getEmailById(id);
            if (!email) {
                return res.status(404).json({ error: 'Email not found' });
            }
            const suggestedReply = await this.ragService.suggestReply(email);
            res.json({ suggestedReply });
        }
        catch (error) {
            logger_1.logger.error(`Error suggesting reply for email ${req.params.id}:`, error);
            res.status(500).json({ error: 'Failed to generate suggested reply' });
        }
    }
}
exports.EmailController = EmailController;
//# sourceMappingURL=EmailController.js.map