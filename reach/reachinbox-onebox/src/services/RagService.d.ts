import { EmailDocument } from '../models/EmailDocument';
export declare class RagService {
    private qdrantUrl;
    private apiKey;
    private qdrantClient;
    private readonly COLLECTION_NAME;
    private readonly VECTOR_SIZE;
    private readonly API_URL;
    private readonly EMBEDDING_API_URL;
    constructor(qdrantUrl: string, apiKey: string);
    private initializeCollection;
    private addSampleProductData;
    private getEmbedding;
    suggestReply(email: EmailDocument): Promise<string>;
}
//# sourceMappingURL=RagService.d.ts.map