// src/services/brain/processors/DataProcessor.js
export class DataProcessor {
  constructor() {
    this.cache = new Map();
  }

  async processData(data) {
    const cacheKey = this.generateCacheKey(data);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const processed = await this.performProcessing(data);
    this.cache.set(cacheKey, processed);
    return processed;
  }

  async performProcessing(data) {
    // Basic data cleaning and processing
    const cleaned = this.cleanData(data);
    const normalized = this.normalizeData(cleaned);
    return normalized;
  }

  cleanData(data) {
    return data.map(row => {
      const cleaned = {};
      for (const [key, value] of Object.entries(row)) {
        cleaned[key] = this.cleanValue(value);
      }
      return cleaned;
    });
  }

  cleanValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value.trim();
    return value;
  }

  normalizeData(data) {
    const normalized = data.filter(row => 
      Object.values(row).some(value => value != null)
    );
    return normalized;
  }

  generateCacheKey(data) {
    return `${data.length}-${Object.keys(data[0]).join('-')}`;
  }

  /**
   * Sample data to fit within memory constraints
   */
  sampleData(data, recommendedSize) {
    if (data.length <= recommendedSize) {
      return data;
    }

    const sampleRate = recommendedSize / data.length;
    const sampledData = data.filter(() => Math.random() < sampleRate);
    return sampledData;
  }

  /**
   * Handle insufficient memory scenarios
   */
  async handleInsufficientMemory(data, memoryStatus) {
    const sampledData = this.sampleData(data, memoryStatus.recommendedSize);
    return this.processData(sampledData, { sampled: true, originalSize: data.length });
  }
}