// src/services/brain/BrainService.js
import { EventEmitter } from 'events';
import { VisualizationSuggester, visualizationSuggester } from './analyzers/visualizationSuggester';
import { PatternDetector, patternDetector } from './analyzers/patternDetector';
import { DataProcessor } from './processors/DataProcessor';
import { MemoryManager } from './managers/MemoryManager';

/**
 * Brain Service - Core AI system for the Data Visualization Platform
 */
class BrainService extends EventEmitter {
  constructor() {
    super();
    this.initialized = false;
    this.dataProcessor = new DataProcessor();
    this.memoryManager = new MemoryManager();
    this.analysisCache = new Map();
    this.userPreferences = new Map();
    this.currentAnalysis = null;
    this.processingQueue = [];
    
    // Use singleton instances
    this.visualizationSuggester = visualizationSuggester;
    this.patternDetector = patternDetector;
  }

  /**
   * Initialize the brain system
   */
  async initialize() {

    console.log('Brain initialization started');
    if (this.initialized) return;

    try {
      await this.loadSavedState();
      this.initialized = true;
      this.emit('ready');
    } catch (error) {
      console.error('Brain initialization failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Process new data and generate insights
   */
  async processData(data, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check memory constraints
      const memoryStatus = this.memoryManager.checkMemoryStatus(data);
      if (!memoryStatus.sufficient) {
        return this.handleInsufficientMemory(data, memoryStatus);
      }

      // Process data
      const processedData = await this.dataProcessor.processData(data);
      
      // Run analysis pipeline
      const analysisResult = await this.runAnalysisPipeline(processedData, options);
      this.currentAnalysis = analysisResult;

      // Cache results
      this.cacheAnalysis(data, analysisResult);

      return analysisResult;
    } catch (error) {
      console.error('Data processing failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Run the complete analysis pipeline
   */

async runAnalysisPipeline(data, options) {
  const analysis = {
    timestamp: Date.now(),
    metadata: {
      rowCount: data.length,
      approximateSize: this.memoryManager.approximateSize(data),
      ...options
    }
  };

  // Analyze columns first
  analysis.columns = this.analyzeColumns(data);

  // Find numeric columns for suggestions
  const numericColumns = Object.entries(analysis.columns)
    .filter(([_, info]) => info.type === 'numeric')
    .map(([name]) => name);

  // Add suggested metrics to metadata
  analysis.metadata.suggestedMetrics = numericColumns;
  analysis.metadata.primaryMetric = numericColumns[0] || 'value';

  // Continue with the rest of the pipeline
  analysis.patterns = await this.patternDetector.analyzePatterns(data, analysis.columns);
  analysis.insights = this.generateInsights(data, analysis.columns, analysis.patterns);
  
  // Pass both data and columns to suggestion generation
  analysis.suggestions = await this.visualizationSuggester.generateSuggestions(
    data,
    analysis.columns,
    analysis.patterns,
    this.userPreferences
  );

  analysis.performance = this.generatePerformanceRecommendations(data, analysis);

  return analysis;
}

  /**
   * Generate insights from analysis
   */
  generateInsights(data, columns, patterns) {
    const insights = [];

    // Column-based insights
    Object.entries(columns).forEach(([columnName, columnInfo]) => {
      insights.push(...this.generateColumnInsights(columnName, columnInfo));
    });

    // Pattern-based insights
    if (patterns.correlations?.length) {
      insights.push(...this.generateCorrelationInsights(patterns.correlations));
    }

    if (patterns.timeSeries?.length) {
      insights.push(...this.generateTimeSeriesInsights(patterns.timeSeries));
    }

    return insights.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations(data, analysis) {
    const recommendations = {
      dataProcessing: [],
      visualization: [],
      memory: []
    };

    // Add data size recommendations
    if (data.length > 10000) {
      recommendations.dataProcessing.push({
        type: 'sampling',
        description: 'Consider using data sampling for smoother performance',
        importance: 0.8
      });
    }

    // Add column-specific recommendations
    Object.entries(analysis.columns).forEach(([columnName, columnInfo]) => {
      if (columnInfo.type === 'numeric' && columnInfo.stats.distinct > 1000) {
        recommendations.visualization.push({
          type: 'binning',
          column: columnName,
          description: 'Use data binning for better visualization performance',
          importance: 0.7
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate column insights
   */
  generateColumnInsights(columnName, columnInfo) {
    const insights = [];

    switch (columnInfo.type) {
      case 'numeric':
        insights.push({
          type: 'distribution',
          columns: [columnName],
          description: `Distribution analysis of ${columnName}`,
          importance: 0.7,
          stats: columnInfo.stats
        });
        break;

      case 'categorical':
        insights.push({
          type: 'category',
          columns: [columnName],
          description: `Category distribution in ${columnName}`,
          importance: 0.6,
          uniqueValues: columnInfo.stats.distinct
        });
        break;

      case 'date':
        insights.push({
          type: 'temporal',
          columns: [columnName],
          description: `Temporal analysis of ${columnName}`,
          importance: 0.8
        });
        break;
    }

    return insights;
  }

  /**
   * Generate correlation insights
   */
  generateCorrelationInsights(correlations) {
    return correlations.map(correlation => ({
      type: 'correlation',
      columns: correlation.columns,
      description: `${correlation.strength} correlation between ${correlation.columns.join(' and ')}`,
      importance: Math.abs(correlation.coefficient),
      correlation: correlation
    }));
  }

  /**
   * Generate time series insights
   */
  generateTimeSeriesInsights(patterns) {
    return patterns.map(pattern => ({
      type: 'timeSeries',
      columns: [pattern.dateColumn, pattern.valueColumn],
      description: `Time series pattern in ${pattern.valueColumn}`,
      importance: pattern.confidence,
      pattern: pattern
    }));
  }

  /**
   * Handle insufficient memory scenarios
   */
  async handleInsufficientMemory(data, memoryStatus) {
    const sampledData = await this.dataProcessor.sampleData(data, memoryStatus.recommendedSize);
    return this.processData(sampledData, { sampled: true, originalSize: data.length });
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences) {
    this.userPreferences = new Map([...this.userPreferences, ...preferences]);
    
    if (this.currentAnalysis) {
      this.currentAnalysis.suggestions = await this.visualizationSuggester.generateSuggestions(
        this.currentAnalysis.data,
        this.currentAnalysis.columns,
        this.currentAnalysis.patterns,
        this.userPreferences
      );
      
      this.emit('suggestionsUpdated', this.currentAnalysis.suggestions);
    }

    await this.saveState();
  }

  /**
   * Cache analysis results
   */
  cacheAnalysis(data, analysis) {
    const cacheKey = this.generateCacheKey(data);
    this.analysisCache.set(cacheKey, {
      analysis,
      timestamp: Date.now()
    });

    this.memoryManager.cleanupCache(this.analysisCache);
  }

  /**
   * Generate cache key for dataset
   */
  generateCacheKey(data) {
    return `${data.length}-${Object.keys(data[0]).join('-')}`;
  }

  /**
   * Load saved state
   */
  async loadSavedState() {
    try {
      const savedPreferences = localStorage.getItem('brainPreferences');
      if (savedPreferences) {
        this.userPreferences = new Map(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.warn('Failed to load saved state:', error);
    }
  }

  /**
   * Save current state
   */
  async saveState() {
    try {
      localStorage.setItem('brainPreferences', 
        JSON.stringify(Array.from(this.userPreferences.entries()))
      );
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.saveState();
    this.removeAllListeners();
    this.analysisCache.clear();
    this.userPreferences.clear();
    this.initialized = false;
  }

  /**
   * Analyze column types and statistics
   */
  analyzeColumns(data) {
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
    }

    return columns;
  }

  /**
   * Detect column type
   */
  detectColumnType(values) {
    const nonNullValue = values.find(v => v !== null && v !== undefined && v !== '');
    
    if (typeof nonNullValue === 'number') return 'numeric';
    if (!isNaN(Date.parse(nonNullValue))) return 'date';
    
    const uniqueCount = new Set(values).size;
    if (uniqueCount <= Math.min(10, values.length * 0.1)) return 'categorical';
    
    return 'text';
  }

  /**
   * Calculate column statistics
   */
  calculateColumnStats(values) {
    const stats = {
      min: null,
      max: null,
      mean: null,
      distinct: new Set(values).size
    };

    if (typeof values[0] === 'number') {
      const numericValues = values.filter(v => typeof v === 'number');
      stats.min = Math.min(...numericValues);
      stats.max = Math.max(...numericValues);
      stats.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    }

    return stats;
  }
}

// Create and export singleton instance
export const brainService = new BrainService();
export default brainService;