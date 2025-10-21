// Simple in-memory vector database implementation
class VectorDbService {
  constructor() {
    this.documents = [];
    this.initialized = false;
  }

  // Initialize with training data
  async initialize() {
    if (this.initialized) return;
    
    // Add example training data
    await this.addDocument({
      id: 'job-application',
      text: 'I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example',
      metadata: { type: 'outreach', context: 'job-application' }
    });

    // Add more training data as needed
    await this.addDocument({
      id: 'product-demo',
      text: 'Our product offers AI-powered email management with IMAP integration, search, and categorization. For demos, share: https://cal.com/example',
      metadata: { type: 'product', context: 'demo' }
    });

    this.initialized = true;
    console.log('Vector database initialized with training data');
  }

  // Add a document to the vector database
  async addDocument(document) {
    // In a real implementation, we would compute embeddings here
    // For simplicity, we're just storing the raw text
    this.documents.push(document);
    return document.id;
  }

  // Simple similarity search based on keyword matching
  // In a real implementation, this would use vector similarity
  async search(query, limit = 3) {
    if (!this.initialized) await this.initialize();
    
    // Simple keyword matching (in a real implementation, this would use vector similarity)
    const results = this.documents.map(doc => {
      // Count matching words as a simple similarity measure
      const queryWords = query.toLowerCase().split(/\s+/);
      const docWords = doc.text.toLowerCase().split(/\s+/);
      
      let matchCount = 0;
      for (const word of queryWords) {
        if (docWords.includes(word)) matchCount++;
      }
      
      return {
        document: doc,
        score: matchCount / queryWords.length // Simple similarity score
      };
    });
    
    // Sort by score and return top results
    return results
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = VectorDbService;