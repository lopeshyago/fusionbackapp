class RateLimiter {
  constructor() {
    this.requestQueue = [];
    this.isProcessing = false;
    this.minInterval = 500; // Minimum 500ms between requests
    this.lastRequestTime = 0;
  }

  async executeRequest(requestFn, key = '') {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, key, resolve, reject, timestamp: Date.now() });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        await this.delay(this.minInterval - timeSinceLastRequest);
      }
      
      const { requestFn, resolve, reject } = this.requestQueue.shift();
      
      try {
        this.lastRequestTime = Date.now();
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        if (error.message.includes('429')) {
          // If we hit rate limit, wait longer before continuing
          await this.delay(2000);
        }
        reject(error);
      }
    }
    
    this.isProcessing = false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const rateLimiter = new RateLimiter();