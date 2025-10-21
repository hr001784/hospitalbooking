"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const express_1 = require("express");
const ElasticsearchService_1 = require("../services/ElasticsearchService");
const logger_1 = require("../utils/logger");
class AccountController {
    elasticsearchService;
    constructor(elasticsearchService) {
        this.elasticsearchService = elasticsearchService;
    }
    async getAccounts(req, res) {
        try {
            const accounts = await this.elasticsearchService.getAccountEmails();
            res.json({ accounts });
        }
        catch (error) {
            logger_1.logger.error('Error getting accounts:', error);
            res.status(500).json({ error: 'Failed to retrieve accounts' });
        }
    }
}
exports.AccountController = AccountController;
//# sourceMappingURL=AccountController.js.map