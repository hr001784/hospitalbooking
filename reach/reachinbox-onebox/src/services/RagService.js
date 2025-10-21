"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagService = void 0;
const js_client_rest_1 = require("@qdrant/js-client-rest");
const EmailDocument_1 = require("../models/EmailDocument");
const logger_1 = require("../utils/logger");
class RagService {
    qdrantUrl;
    apiKey;
    qdrantClient;
    COLLECTION_NAME = 'product_data';
    VECTOR_SIZE = 768; // Typical size for embedding models
    API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    EMBEDDING_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent';
    constructor(qdrantUrl, apiKey) {
        this.qdrantUrl = qdrantUrl;
        this.apiKey = apiKey;
        this.qdrantClient = new js_client_rest_1.QdrantClient({ url: qdrantUrl });
        this.initializeCollection();
    }
    async initializeCollection() {
        try {
            const collections = await this.qdrantClient.getCollections();
            if (!collections.collections.some(c => c.name === this.COLLECTION_NAME)) {
                await this.qdrantClient.createCollection(this.COLLECTION_NAME, {
                    vectors: {
                        size: this.VECTOR_SIZE,
                        distance: 'Cosine'
                    }
                });
                logger_1.logger.info(`Created Qdrant collection: ${this.COLLECTION_NAME}`);
                // Add some sample product data
                await this.addSampleProductData();
            }
            else {
                logger_1.logger.info(`Qdrant collection ${this.COLLECTION_NAME} already exists`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error initializing Qdrant collection:', error);
        }
    }
    async addSampleProductData() {
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
            },
            {
                id: '4',
                text: 'I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example',
                metadata: { type: 'job_application' }
            },
            {
                id: '5',
                text: 'Our product demo showcases our AI-powered email management system that helps users organize and prioritize their inbox.',
                metadata: { type: 'product_demo' }
            },
            {
                id: '6',
                text: 'ReachInbox features include AI categorization, smart filtering, and RAG-based suggested replies to help you manage emails efficiently.',
                metadata: { type: 'product_features' }
            },
            {
                id: '7',
                text: 'Thank you for your interest in our product. I\'d be happy to schedule a demo call with you. Here\'s my calendar link: https://calendly.com/product-demo/30min',
                metadata: { type: 'product_demo_request', has_booking_link: true }
            },
            {
                id: '8',
                text: 'We\'re excited to offer you a 14-day free trial of our premium features. No credit card required!',
                metadata: { type: 'trial_offer' }
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
        logger_1.logger.info('Added sample product data to Qdrant');
    }
    async getEmbedding(text) {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting embedding:', error);
            // Return a zero vector as fallback
            return Array(this.VECTOR_SIZE).fill(0);
        }
    }
    async suggestReply(email) {
        try {
            // 1. Get embedding for the email
            const emailText = `Subject: ${email.subject}\nFrom: ${email.from}\nBody: ${email.body}`;
            const queryEmbedding = await this.getEmbedding(emailText);
            // 2. Search for relevant context in the vector database
            const searchResults = await this.qdrantClient.search(this.COLLECTION_NAME, {
                vector: queryEmbedding,
                limit: 3
            });
            
            // Check for different scenarios based on email content and search results
            const lowerCaseEmail = emailText.toLowerCase();
            
            // Job Application Scenario
            const jobApplicationResult = searchResults.find(result => 
                result.payload.type === 'job_application');
                
            if (jobApplicationResult && 
                (lowerCaseEmail.includes('interview') || 
                 lowerCaseEmail.includes('shortlisted'))) {
                return "Thank you for shortlisting my profile! I'm available for a technical interview. You can book a slot here: https://cal.com/example";
            }
            
            // Product Demo Request Scenario
            const isProductDemoRequest = lowerCaseEmail.includes('demo') || 
                                        lowerCaseEmail.includes('showcase') ||
                                        lowerCaseEmail.includes('presentation');
            
            const hasProductDemoContext = searchResults.some(result => 
                result.payload.type === 'product_demo' || 
                result.payload.type === 'product_demo_request'
            );
            
            if (isProductDemoRequest && hasProductDemoContext) {
                return `Thank you for your interest in seeing a demo of our product. I'd be delighted to walk you through our AI-powered email management system. Please use this link to schedule a convenient time for our demo call: https://calendly.com/product-demo/30min`;
            }
            
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
If the context mentions a booking link or calendar link, include it in your response.
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
        }
        catch (error) {
            logger_1.logger.error('Error suggesting reply:', error);
            return 'Sorry, I could not generate a reply at this time.';
        }
    }
}
exports.RagService = RagService;
//# sourceMappingURL=RagService.js.map