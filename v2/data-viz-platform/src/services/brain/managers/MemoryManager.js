// src/services/brain/managers/MemoryManager.js
export class MemoryManager {
    constructor() {
      this.maxMemoryUsage = 0.8; // 80% of available memory
      this.cleanupThreshold = 0.7; // 70% of available memory
    }
  
    checkMemoryStatus(data) {
      const approximateSize = this.approximateSize(data);
      const available = this.getAvailableMemory();
      
      return {
        sufficient: approximateSize < available * this.maxMemoryUsage,
        recommendedSize: available * this.cleanupThreshold,
        currentSize: approximateSize,
        availableMemory: available
      };
    }
  
    approximateSize(data) {
      if (!data || !data.length) return 0;
      
      // Sample a few rows to estimate average size
      const sampleSize = Math.min(10, data.length);
      let totalSize = 0;
      
      for (let i = 0; i < sampleSize; i++) {
        totalSize += this.getObjectSize(data[i]);
      }
      
      return (totalSize / sampleSize) * data.length;
    }
  
    getObjectSize(obj) {
      return JSON.stringify(obj).length * 2; // Rough estimate
    }
  
    getAvailableMemory() {
      return typeof window !== 'undefined' ? window.performance?.memory?.jsHeapSizeLimit : Infinity;
    }
  
    cleanupCache(cache) {
      if (!cache || cache.size === 0) return;
      
      const oldestEntries = [...cache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, Math.floor(cache.size * 0.2)); // Remove oldest 20%
        
      oldestEntries.forEach(([key]) => cache.delete(key));
    }
  }