import { EmailDocument } from '../models/EmailDocument';
import { logger } from '../utils/logger';

export class AiCategoryService {
  private readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  constructor(private apiKey: string) {}

  public async categorizeEmail(email: EmailDocument): Promise<EmailDocument['aiCategory']> {
    try {
      // Extract relevant information from the email
      const { subject, body, from } = email;
      
      const systemInstruction = "You are an expert email classifier. Your task is to analyze the provided email text and categorize it into one of the following labels: Interested, Meeting Booked, Not Interested, Spam, or Out of Office.";
      
      const responseSchema = {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            enum: ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"]
          }
        }
      };

      const prompt = `
Subject: ${subject}
From: ${from}
Body:
${body}
`;

      const response = await fetch(`${this.API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemInstruction
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Gemini API error: ${response.status} ${errorText}`);
        return 'Uncategorized';
      }

      const data = await response.json();
      const category = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (category) {
        try {
          const parsedCategory = JSON.parse(category);
          if (parsedCategory.category) {
            return parsedCategory.category as EmailDocument['aiCategory'];
          }
        } catch (parseError) {
          logger.error('Error parsing Gemini API response:', parseError);
        }
      }

      logger.warn('Could not extract category from Gemini API response, using default');
      return 'Uncategorized';
    } catch (error) {
      logger.error('Error categorizing email:', error);
      return 'Uncategorized';
    }
  }
}