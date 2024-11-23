import { chunk } from 'lodash';

class DataManager {
  constructor() {
    this.data = null;
    this.analysis = null;
    this.metadata = null;
    this.chunks = [];
    this.chunkSize = 1000;
    this.processedRows = 0;
    this.totalRows = 0;
    this.onProgressCallback = null;
  }

  setProgressCallback(callback) {
    this.onProgressCallback = callback;
  }

  updateProgress() {
    if (this.onProgressCallback) {
      const progress = (this.processedRows / this.totalRows) * 100;
      this.onProgressCallback(progress);
    }
  }

  async processData(rawData) {
    try {
      // Validate input
      if (!rawData || !Array.isArray(rawData)) {
        throw new Error('Invalid data format: Expected an array');
      }

      // Initialize processing
      this.totalRows = rawData.length;
      this.processedRows = 0;
      
      // Basic validation of data structure
      if (this.totalRows > 0) {
        const firstRow = rawData[0];
        if (typeof firstRow !== 'object') {
          throw new Error('Invalid data format: Expected array of objects');
        }
      }

      // Create chunks for processing
      this.chunks = chunk(rawData, this.chunkSize);
      
      // Process chunks
      const processedChunks = [];
      for (const dataChunk of this.chunks) {
        const processedChunk = await this.processChunk(dataChunk);
        processedChunks.push(processedChunk);
        this.processedRows += dataChunk.length;
        this.updateProgress();
      }

      // Combine processed data
      this.data = processedChunks.flat();
      
      // Generate analysis
      this.analysis = await this.analyzeData(this.data);
      
      // Generate metadata
      this.metadata = {
        totalRows: this.totalRows,
        processedRows: this.processedRows,
        columns: Object.keys(this.data[0] || {}),
        lastUpdated: new Date().toISOString()
      };

      return {
        data: this.data,
        analysis: this.analysis,
        metadata: this.metadata
      };

    } catch (error) {
      console.error('Error processing data:', error);
      throw error;
    }
  }

  async processChunk(chunk) {
    return chunk.map(row => {
      // Create a new object with processed values
      const processedRow = {};
      
      for (const [key, value] of Object.entries(row)) {
        processedRow[key] = this.processValue(value);
      }
      
      return processedRow;
    });
  }

  processValue(value) {
    if (value === null || value === undefined) {
      return null;
    }

    // Try to parse numbers
    if (typeof value === 'string' && !isNaN(value)) {
      return Number(value);
    }

    // Try to parse dates
    if (typeof value === 'string') {
      const date = new Date(value);
      if (date.toString() !== 'Invalid Date') {
        return date;
      }
    }

    return value;
  }

  async analyzeData(data) {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const analysis = {
      rowCount: data.length,
      columns: {},
      summary: {
        numericColumns: [],
        categoricalColumns: [],
        dateColumns: [],
        emptyValueCounts: {}
      }
    };

    for (const column of columns) {
      const columnAnalysis = this.analyzeColumn(data, column);
      analysis.columns[column] = columnAnalysis;
      
      // Categorize column
      if (columnAnalysis.type === 'number') {
        analysis.summary.numericColumns.push(column);
      } else if (columnAnalysis.type === 'date') {
        analysis.summary.dateColumns.push(column);
      } else {
        analysis.summary.categoricalColumns.push(column);
      }
      
      analysis.summary.emptyValueCounts[column] = columnAnalysis.nullCount;
    }

    return analysis;
  }

  analyzeColumn(data, column) {
    const values = data.map(row => row[column]).filter(v => v != null);
    const uniqueValues = new Set(values);

    const analysis = {
      type: this.getColumnType(values),
      uniqueCount: uniqueValues.size,
      nullCount: data.length - values.length
    };

    if (analysis.type === 'number') {
      analysis.stats = {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: this.calculateMedian(values)
      };
    }

    return analysis;
  }

  getColumnType(values) {
    if (values.length === 0) return 'unknown';
    
    const sample = values.find(v => v !== null);
    if (sample === undefined) return 'unknown';

    if (typeof sample === 'number') return 'number';
    if (sample instanceof Date) return 'date';
    if (typeof sample === 'boolean') return 'boolean';
    return 'string';
  }

  calculateMedian(numbers) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }

  // Getter methods
  getData() {
    return this.data;
  }

  getAnalysis() {
    return this.analysis;
  }

  getMetadata() {
    return this.metadata;
  }

  // Utility methods
  getColumnValues(column) {
    if (!this.data || !column) return [];
    return this.data.map(row => row[column]);
  }

  getUniqueValues(column) {
    return [...new Set(this.getColumnValues(column))];
  }
}

export const dataManager = new DataManager();
export default dataManager;