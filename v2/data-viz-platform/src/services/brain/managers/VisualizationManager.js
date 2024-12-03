// src/services/brain/managers/VisualizationManager.js
import { visualizationSuggester } from '../analyzers/visualizationSuggester';

export class VisualizationManager {
  constructor() {
    this.suggester = visualizationSuggester;
    this.settings = {
      minConfidence: 0.6,
      maxSuggestions: 10,
      defaultSuggestions: {
        '2d': ['bar', 'line', 'scatter'],
        '3d': ['scatter3d', 'surface3d']
      }
    };
  }

  async initialize(settings = {}) {
    this.settings = { ...this.settings, ...settings };
    await this.suggester.initialize(settings);
  }

  async generateSuggestions(data, analysis, preferences) {
    try {
      const suggestions = await this.suggester.generateSuggestions(
        data, 
        analysis.columns,
        analysis.patterns,
        preferences
      );

      if (!suggestions.length) {
        return this.generateDefaultSuggestions(data, analysis);
      }

      return this.filterAndRankSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return this.generateDefaultSuggestions(data, analysis);
    }
  }

  filterAndRankSuggestions(suggestions) {
    return suggestions
      .filter(s => s.score >= this.settings.minConfidence)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.settings.maxSuggestions);
  }

  generateDefaultSuggestions(data, analysis) {
    const numericColumns = Object.entries(analysis.columns)
      .filter(([_, info]) => info.type === 'numeric')
      .map(([name]) => name);

    if (numericColumns.length < 2) return [];

    const defaults = [];

    // Add 2D defaults
    this.settings.defaultSuggestions['2d'].forEach(type => {
      defaults.push({
        id: `default-${type}`,
        type,
        score: 0.7,
        columns: {
          x: numericColumns[0],
          y: numericColumns[1]
        },
        visualization: {
          type,
          config: {
            x: numericColumns[0],
            y: numericColumns[1]
          }
        }
      });
    });

    // Add 3D if enough numeric columns
    if (numericColumns.length >= 3) {
      this.settings.defaultSuggestions['3d'].forEach(type => {
        defaults.push({
          id: `default-${type}`,
          type,
          score: 0.7,
          columns: {
            x: numericColumns[0],
            y: numericColumns[1],
            z: numericColumns[2]
          },
          visualization: {
            type,
            dimensions: 3,
            config: {
              x: numericColumns[0],
              y: numericColumns[1],
              z: numericColumns[2]
            }
          }
        });
      });
    }

    return defaults;
  }
}