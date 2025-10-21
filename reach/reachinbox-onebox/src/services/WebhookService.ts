import { EmailDocument } from '../models/EmailDocument';
import { logger } from '../utils/logger';

export class WebhookService {
  constructor(
    private slackWebhookUrl: string,
    private genericWebhookUrl: string
  ) {}

  public async triggerWebhook(emailData: EmailDocument): Promise<void> {
    // Only trigger webhooks for emails categorized as 'Interested'
    if (emailData.aiCategory !== 'Interested') {
      return;
    }

    try {
      // 1. Send notification to Slack
      await this.sendSlackNotification(emailData);
      
      // 2. Send data to generic webhook for automation
      await this.sendGenericWebhook(emailData);
      
      logger.info(`Webhook triggered for email: ${emailData.id}`);
    } catch (error) {
      logger.error('Error triggering webhook:', error);
    }
  }

  private async sendSlackNotification(emailData: EmailDocument): Promise<void> {
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
    } catch (error) {
      logger.error('Error sending Slack notification:', error);
      throw error;
    }
  }

  private async sendGenericWebhook(emailData: EmailDocument): Promise<void> {
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
    } catch (error) {
      logger.error('Error sending generic webhook:', error);
      throw error;
    }
  }
}