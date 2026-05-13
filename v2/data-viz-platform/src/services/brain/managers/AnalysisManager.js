// src/services/brain/managers/AnalysisManager.js
import { patternDetector } from '../analyzers/patternDetector';
import { columnAnalyzer } from '../analyzers/columnAnalyzer';

export class AnalysisManager {
  constructor() {
    this.patternDetector = patternDetector;
    this.columnAnalyzer = columnAnalyzer;
    this.settings = {};
  }

  async initialize(settings = {}) {
    this.settings = { ...this.settings, ...settings };
    await this.patternDetector.initialize(settings);
  }

  async analyzeColumns(data) {
    try {
      return await this.columnAnalyzer.analyzeColumns(data);
    } catch (error) {
      console.error('Column analysis failed:', error);
      throw error;
    }
  }

  async detectPatterns(data, columns) {
    try {
      return await this.patternDetector.analyzePatterns(data, columns);
    } catch (error) {
      console.error('Pattern detection failed:', error);
      throw error;
    }
  }

  generateAnalysisMetadata(data, options = {}) {
    return {
      rowCount: data.length,
      columnCount: Object.keys(data[0]).length,
      timestamp: Date.now(),
      options
    };
  }
}