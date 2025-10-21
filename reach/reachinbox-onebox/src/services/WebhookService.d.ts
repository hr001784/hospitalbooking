import { EmailDocument } from '../models/EmailDocument';
export declare class WebhookService {
    private slackWebhookUrl;
    private genericWebhookUrl;
    constructor(slackWebhookUrl: string, genericWebhookUrl: string);
    triggerWebhook(emailData: EmailDocument): Promise<void>;
    private sendSlackNotification;
    private sendGenericWebhook;
}
//# sourceMappingURL=WebhookService.d.ts.map