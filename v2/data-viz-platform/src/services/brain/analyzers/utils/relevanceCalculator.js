// src/services/brain/analyzers/utils/relevanceCalculator.js

export const relevanceCalculator = {
    calculateRelevance(columnInfo, rule) {
      let relevance = 1.0;
  
      // Calculate base relevance based on column type
      relevance *= this.calculateNumericRelevance(columnInfo);
  
      // Adjust for data quality
      relevance *= this.calculateQualityFactor(columnInfo);
  
      return Math.min(1, relevance);
    },
  
    calculateNumericRelevance(column) {
      let relevance = 1.0;
  
      // Adjust based on cardinality
      if (column.stats.distinct <= 10) {
        relevance *= 0.6; // Lower relevance for low cardinality
      } else if (column.stats.distinct <= 50) {
        relevance *= 0.8; // Moderate relevance for medium cardinality
      }
  
      return relevance;
    },
  
    calculateQualityFactor(column) {
      let quality = 1.0;
  
      // Adjust for null values
      const nullRatio = column.nullCount / column.unique;
      if (nullRatio > 0.2) {
        quality *= 0.7;
      }
  
      return quality;
    }
  };