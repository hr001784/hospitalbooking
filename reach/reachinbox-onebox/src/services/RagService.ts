import { QdrantClient } from '@qdrant/js-client-rest';
import { EmailDocument } from '../models/EmailDocument';
import { logger } from '../utils/logger';

export class RagService {
  private qdrantClient: QdrantClient;
  private readonly COLLECTION_NAME = 'product_knowledge';
  private readonly VECTOR_SIZE = 768; // Typical size for embedding models
  private readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private readonly EMBEDDING_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent';

  constructor(
    private qdrantUrl: string,
    private apiKey: string
  ) {
    this.qdrantClient = new QdrantClient({ url: qdrantUrl });
    this.initializeCollection();
  }

  private async initializeCollection() {
    try {
      const collections = await this.qdrantClient.getCollections();
      
      if (!collections.collections.some(c => c.name === this.COLLECTION_NAME)) {
        await this.qdrantClient.createCollection(this.COLLECTION_NAME, {
          vectors: {
            size: this.VECTOR_SIZE,
            distance: 'Cosine'
          }
        });
        
        logger.info(`Created Qdrant collection: ${this.COLLECTION_NAME}`);
        
        // Add some sample product data
        await this.addSampleProductData();
      } else {
        logger.info(`Qdrant collection ${this.COLLECTION_NAME} already exists`);
      }
    } catch (error) {
      logger.error('Error initializing Qdrant collection:', error);
    }
  }

  private async addSampleProductData() {
    const sampleData = [
      {
        id: '1',
        text: 'Our premium plan costs $99/month and includes unlimited access to all features. You can schedule a demo at calendly.com/our-product/demo.',
        metadata: { type: 'pricing' }
      },
      {
        id: '2',
        text: 'We offer a 14-day free trial with no credit card required. Sign up at our website: example.com/signup.',
        metadata: { type: 'trial' }
      },
      {
        id: '3',
        text: 'Our team is available for meetings Monday through Friday, 9 AM to 5 PM EST. Book a time that works for you: calendly.com/our-product/meeting.',
        metadata: { type: 'meeting' }
      }
    ];

    for (const data of sampleData) {
      const embedding = await this.getEmbedding(data.text);
      
      await this.qdrantClient.upsert(this.COLLECTION_NAME, {
        wait: true,
        points: [
          {
            id: data.id,
            vector: embedding,
            payload: {
              text: data.text,
              ...data.metadata
            }
          }
        ]
      });
    }
    
    logger.info('Added sample product data to Qdrant');
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.EMBEDDING_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: {
            parts: [
              { text }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding.values;
    } catch (error) {
      logger.error('Error getting embedding:', error);
      // Return a zero vector as fallback
      return Array(this.VECTOR_SIZE).fill(0);
    }
  }

  public async suggestReply(email: EmailDocument): Promise<string> {
    try {
      // 1. Get embedding for the email
      const emailText = `Subject: ${email.subject}\nFrom: ${email.from}\nBody: ${email.body}`;
      const queryEmbedding = await this.getEmbedding(emailText);
      
      // 2. Search for relevant context in the vector database
      const searchResults = await this.qdrantClient.search(this.COLLECTION_NAME, {
        vector: queryEmbedding,
        limit: 3
      });
      
      // 3. Extract the context from the search results
      const context = searchResults.map(result => result.payload.text).join('\n\n');
      
      // 4. Generate a reply using the Gemini API
      const systemInstruction = "Act as a helpful assistant that writes professional, relevant email replies.";
      
      const prompt = `
${systemInstruction}

CONTEXT INFORMATION:
${context}

ORIGINAL EMAIL:
${emailText}

Based ONLY on the context provided and the original email, draft a professional and helpful reply. Be concise.
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
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 800
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const suggestedReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return suggestedReply || 'Sorry, I could not generate a reply at this time.';
    } catch (error) {
      logger.error('Error suggesting reply:', error);
      return 'Sorry, I could not generate a reply at this time.';
    }
  }
}