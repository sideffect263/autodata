// src/services/brain/utils/columnAnalyzer.js

export class ColumnAnalyzer {
  constructor() {
    this.typePatterns = {
      numeric: /^-?\d*\.?\d+$/,
      date: /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,
      boolean: /^(true|false|0|1)$/i
    };
  }

  /**
   * Analyze columns to determine types and statistics
   */
  analyzeColumns(data) {
    if (!data || data.length === 0) {
      return {};
    }

    const columns = {};
    const sample = data[0];

    for (const [key, value] of Object.entries(sample)) {
      const values = data.map(row => row[key]);
      
      columns[key] = {
        name: key,
        type: this.detectColumnType(values),
        unique: new Set(values).size,
        nullCount: values.filter(v => v === null || v === undefined || v === '').length,
        stats: this.calculateColumnStats(values)
      };

      // Add additional metadata based on type
      if (columns[key].type === 'numeric') {
        columns[key].stats = {
          ...columns[key].stats,
          ...this.calculateNumericStats(values)
        };
      } else if (columns[key].type === 'categorical') {
        columns[key].stats = {
          ...columns[key].stats,
          ...this.calculateCategoricalStats(values)
        };
      }
    }

    return columns;
  }

  /**
   * Detect column type from values
   */
  detectColumnType(values) {
    if (!values || values.length === 0) return 'unknown';

    // Get first non-null value
    const sample = values.find(v => v !== null && v !== undefined && v !== '');
    if (!sample) return 'unknown';

    // Check for numeric values
    if (typeof sample === 'number' || this.typePatterns.numeric.test(sample)) {
      return 'numeric';
    }

    // Check for dates
    if (!isNaN(Date.parse(sample)) || this.typePatterns.date.test(sample)) {
      return 'date';
    }

    // Check for booleans
    if (this.typePatterns.boolean.test(sample)) {
      return 'boolean';
    }

    // Check for categorical (limited unique values)
    const uniqueValues = new Set(values).size;
    if (uniqueValues <= Math.min(10, values.length * 0.2)) {
      return 'categorical';
    }

    return 'text';
  }

  /**
   * Calculate basic column statistics
   */
  calculateColumnStats(values) {
    return {
      count: values.length,
      distinct: new Set(values).size,
      nullCount: values.filter(v => v === null || v === undefined || v === '').length,
      mode: this.calculateMode(values),
      uniqueRatio: new Set(values).size / values.length
    };
  }

  /**
   * Calculate numeric column statistics
   */
  calculateNumericStats(values) {
    const numericValues = values
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => Number(v))
      .filter(v => !isNaN(v));

    if (numericValues.length === 0) return {};

    const sorted = [...numericValues].sort((a, b) => a - b);
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / numericValues.length;
    const midIndex = Math.floor(sorted.length / 2);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: sorted.length % 2 === 0 
        ? (sorted[midIndex - 1] + sorted[midIndex]) / 2 
        : sorted[midIndex],
      stdDev: this.calculateStdDev(numericValues, mean),
      quartiles: this.calculateQuartiles(sorted),
      skewness: this.calculateSkewness(numericValues, mean),
      kurtosis: this.calculateKurtosis(numericValues, mean)
    };
  }

  /**
   * Calculate categorical column statistics
   */
  calculateCategoricalStats(values) {
    const frequencies = values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    const categories = Object.entries(frequencies)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / values.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    return {
      categories,
      dominantCategory: categories[0]?.category,
      entropy: this.calculateEntropy(categories)
    };
  }

  /**
   * Statistical utility functions
   */
  calculateMode(values) {
    const frequencies = values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    let mode = null;
    let maxFreq = 0;

    for (const [value, freq] of Object.entries(frequencies)) {
      if (freq > maxFreq) {
        mode = value;
        maxFreq = freq;
      }
    }

    return mode;
  }

  calculateStdDev(values, mean) {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  calculateQuartiles(sorted) {
    const q1Index = Math.floor(sorted.length / 4);
    const q3Index = Math.floor((3 * sorted.length) / 4);

    return {
      q1: sorted[q1Index],
      q3: sorted[q3Index],
      iqr: sorted[q3Index] - sorted[q1Index]
    };
  }

  calculateSkewness(values, mean) {
    const n = values.length;
    const stdDev = this.calculateStdDev(values, mean);
    const cubed = values.reduce((sum, val) => 
      sum + Math.pow((val - mean) / stdDev, 3)
    , 0);
    return (n / ((n - 1) * (n - 2))) * cubed;
  }

  calculateKurtosis(values, mean) {
    const n = values.length;
    const stdDev = this.calculateStdDev(values, mean);
    const fourth = values.reduce((sum, val) => 
      sum + Math.pow((val - mean) / stdDev, 4)
    , 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * fourth - 
           (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  calculateEntropy(categories) {
    return -categories.reduce((entropy, cat) => {
      const p = cat.percentage / 100;
      return entropy + (p * Math.log2(p));
    }, 0);
  }
}

export const columnAnalyzer = new ColumnAnalyzer();
export default columnAnalyzer;