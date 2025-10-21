"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const EmailDocument_1 = require("../models/EmailDocument");
const logger_1 = require("../utils/logger");
class WebhookService {
    slackWebhookUrl;
    genericWebhookUrl;
    constructor(slackWebhookUrl, genericWebhookUrl) {
        this.slackWebhookUrl = slackWebhookUrl;
        this.genericWebhookUrl = genericWebhookUrl;
    }
    async triggerWebhook(emailData) {
        // Only trigger webhooks for emails categorized as 'Interested'
        if (emailData.aiCategory !== 'Interested') {
            return;
        }
        try {
            // 1. Send notification to Slack
            await this.sendSlackNotification(emailData);
            // 2. Send data to generic webhook for automation
            await this.sendGenericWebhook(emailData);
            logger_1.logger.info(`Webhook triggered for email: ${emailData.id}`);
        }
        catch (error) {
            logger_1.logger.error('Error triggering webhook:', error);
        }
    }
    async sendSlackNotification(emailData) {
        try {
            const response = await fetch(this.slackWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: `🔔 *New Interested Lead!*\nFrom: ${emailData.from}\nSubject: ${emailData.subject}\nDate: ${emailData.date.toLocaleString()}`
                })
            });
            if (!response.ok) {
                throw new Error(`Slack webhook error: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending Slack notification:', error);
            throw error;
        }
    }
    async sendGenericWebhook(emailData) {
        try {
            const response = await fetch(this.genericWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event: 'InterestedLead',
                    email: {
                        id: emailData.id,
                        accountId: emailData.accountId,
                        subject: emailData.subject,
                        from: emailData.from,
                        date: emailData.date,
                        category: emailData.aiCategory
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`Generic webhook error: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending generic webhook:', error);
            throw error;
        }
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=WebhookService.js.map