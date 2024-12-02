// src/services/brain/BrainService.js
import { EventEmitter } from 'events';
import { VisualizationSuggester } from './analyzers/visualizationSuggester';
import { PatternDetector } from './analyzers/patternDetector';
import { DataProcessor } from './processors/DataProcessor';
import { MemoryManager } from './managers/MemoryManager';
import { ColumnAnalyzer } from './analyzers/columnAnalyzer';
import { insightGenerator } from './analyzers/insightGenerator';

/**
 * Enhanced Brain Service for Data Visualization Platform
 * Handles data analysis, pattern detection, and visualization suggestions
 */
class BrainService extends EventEmitter {
  constructor() {
    super();
    this.initialized = false;
    this.dataProcessor = new DataProcessor();
    this.memoryManager = new MemoryManager();
    this.columnAnalyzer = new ColumnAnalyzer();
    this.patternDetector = new PatternDetector();
    this.visualizationSuggester = new VisualizationSuggester();
    this.insightGenerator = insightGenerator; // Using the singleton instance
    
    // State management
    this.analysisCache = new Map();
    this.suggestionHistory = new Map();
    this.userPreferences = new Map();
    this.currentAnalysis = null;
    this.processingQueue = [];
    
    // Analysis settings
    this.settings = {
      maxDataPoints: 100000,
      minConfidenceScore: 0.6,
      maxSuggestions: 10,
      correlationThreshold: 0.5,
      patternDetectionThreshold: 0.7,
      maxInsightsPerType: 5,
      maxTotalInsights: 20
    };
  }

  /**
   * Initialize the brain system
   */
  async initialize(options = {}) {
    console.log('Brain initialization started');
    if (this.initialized) return;

    try {
      // Load saved state and preferences
      await this.loadSavedState();
      
      // Initialize analyzers with options
      await Promise.all([
        this.patternDetector.initialize(options),
        this.visualizationSuggester.initialize(options)
      ]);

      this.initialized = true;
      this.emit('ready');
    } catch (error) {
      console.error('Brain initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process new data and generate insights
   */
  async processData(data, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('Processing data:', data?.length, 'rows');

    try {
      // Validate input data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data format: Must be non-empty array');
      }

      console.log('Data validation complete');

      // Check memory constraints
      const memoryStatus = this.memoryManager.checkMemoryStatus(data);
      if (!memoryStatus.sufficient) {
        return this.handleInsufficientMemory(data, memoryStatus);
      }

      // Clean and preprocess data
      const processedData = await this.dataProcessor.processData(data);

      // Run analysis pipeline
      const analysisResult = await this.runAnalysisPipeline(processedData, options);
      this.currentAnalysis = analysisResult;

      // Cache results
      this.cacheAnalysis(data, analysisResult);

      console.log('Analysis complete:', analysisResult);
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
    const startTime = Date.now();

    try {
      // Initialize analysis object
      const analysis = {
        timestamp: startTime,
        metadata: {
          rowCount: data.length,
          approximateSize: this.memoryManager.approximateSize(data),
          ...options
        }
      };

      // Analyze columns and data types
      analysis.columns = await this.columnAnalyzer.analyzeColumns(data);

      // Find numeric columns for analysis
      const numericColumns = Object.entries(analysis.columns)
        .filter(([_, info]) => info.type === 'numeric')
        .map(([name]) => name);

      // Update metadata
      analysis.metadata.numericColumns = numericColumns;
      analysis.metadata.primaryMetric = numericColumns[0] || null;

      // Detect patterns
      analysis.patterns = await this.patternDetector.analyzePatterns(data, analysis.columns);

      // Generate insights using InsightGenerator
      analysis.insights = await this.insightGenerator.generateInsights(
        data, 
        analysis.columns, 
        analysis.patterns
      );

      // Generate visualization suggestions
      analysis.suggestions = await this.generateScoredSuggestions(
        data,
        analysis.columns,
        analysis.patterns,
        this.userPreferences
      );

      // Add performance recommendations
      analysis.performance = this.generatePerformanceRecommendations(data, analysis);

      // Calculate analysis duration
      analysis.metadata.analysisTime = Date.now() - startTime;

      return analysis;

    } catch (error) {
      console.error('Analysis pipeline failed:', error);
      throw error;
    }
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

    // Data size recommendations
    if (data.length > 10000) {
      recommendations.dataProcessing.push({
        type: 'sampling',
        description: 'Consider using data sampling for smoother performance',
        importance: 0.8
      });
    }

    // Column-specific recommendations
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

    // Memory recommendations
    const memoryStatus = this.memoryManager.checkMemoryStatus(data);
    if (!memoryStatus.sufficient) {
      recommendations.memory.push({
        type: 'optimization',
        description: 'Dataset size exceeds memory limits. Consider data sampling or chunking.',
        importance: 0.9
      });
    }

    return recommendations;
  }


  getInsightsForColumn(columnName) {
    if (!this.currentAnalysis?.insights) return [];
    
    return this.currentAnalysis.insights.filter(insight => 
      insight.columns?.includes(columnName) || 
      insight.column === columnName
    );
  }

  /**
   * Generate scored visualization suggestions
   */
  async generateScoredSuggestions(data, columns, patterns, preferences) {
    const suggestions = await this.visualizationSuggester.generateSuggestions(
      data,
      columns,
      patterns,
      preferences
    );

    return suggestions
      .filter(suggestion => suggestion.score >= this.settings.minConfidenceScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.settings.maxSuggestions);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences) {
    this.userPreferences = new Map([...this.userPreferences, ...preferences]);
    
    if (this.currentAnalysis) {
      // Regenerate suggestions with updated preferences
      const newSuggestions = await this.generateScoredSuggestions(
        this.currentAnalysis.data,
        this.currentAnalysis.columns,
        this.currentAnalysis.patterns,
        this.userPreferences
      );
      
      this.currentAnalysis.suggestions = newSuggestions;
      this.emit('suggestionsUpdated', newSuggestions);
    }

    await this.saveState();
  }

  /**
   * State management
   */
  async saveState() {
    try {
      localStorage.setItem('brainPreferences', 
        JSON.stringify(Array.from(this.userPreferences.entries()))
      );
      localStorage.setItem('brainSettings',
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.warn('Failed to save brain state:', error);
    }
  }

  async loadSavedState() {
    try {
      const savedPreferences = localStorage.getItem('brainPreferences');
      if (savedPreferences) {
        this.userPreferences = new Map(JSON.parse(savedPreferences));
      }

      const savedSettings = localStorage.getItem('brainSettings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.warn('Failed to load saved state:', error);
    }
  }

  /**
   * Memory management
   */
  async handleInsufficientMemory(data, memoryStatus) {
    const sampledData = await this.dataProcessor.sampleData(data, memoryStatus.recommendedSize);
    return this.processData(sampledData, { sampled: true, originalSize: data.length });
  }

  /**
   * Cache management
   */
  cacheAnalysis(data, analysis) {
    const cacheKey = this.generateCacheKey(data);
    this.analysisCache.set(cacheKey, {
      analysis,
      timestamp: Date.now()
    });
    this.memoryManager.cleanupCache(this.analysisCache);
  }

  generateCacheKey(data) {
    const sampleSize = Math.min(100, data.length);
    const sample = data.slice(0, sampleSize);
    return `${data.length}-${Object.keys(data[0]).join('-')}-${JSON.stringify(sample)}`;
  }

  /**
   * Cleanup and disposal
   */
  dispose() {
    this.saveState();
    this.removeAllListeners();
    this.analysisCache.clear();
    this.suggestionHistory.clear();
    this.userPreferences.clear();
    this.initialized = false;
  }
}

// Create and export singleton instance
export const brainService = new BrainService();
export default brainService;