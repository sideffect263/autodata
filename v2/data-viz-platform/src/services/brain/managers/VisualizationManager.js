// src/services/brain/managers/VisualizationManager.js
import { visualizationSuggester } from '../analyzers/visualizationSuggester';

export class VisualizationManager {
  constructor() {
    this.suggester = visualizationSuggester;
    this.settings = {
      minConfidence: 0.6,
      maxSuggestions: 10,
      requiredTypes: {
        '2d': ['bar', 'line', 'scatter', 'pie'],
        '3d': ['scatter3d', 'surface', 'bar3d']
      },
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
      // Get suggestions from suggester
      const suggestions = await this.suggester.generateSuggestions(
        data, 
        analysis.columns,
        analysis.patterns,
        preferences
      );

      // Check if we have all required visualization types
      const existingTypes = new Set(suggestions.map(s => s.type));
      const requiredSuggestions = this.generateRequiredSuggestions(data, analysis, existingTypes);

      // Combine and filter all suggestions
      const allSuggestions = [...suggestions, ...requiredSuggestions];
      
      return this.filterAndRankSuggestions(allSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return this.generateDefaultSuggestions(data, analysis);
    }
  }

  generateRequiredSuggestions(data, analysis, existingTypes) {
    const requiredSuggestions = [];
    const numericColumns = Object.entries(analysis.columns)
      .filter(([_, info]) => info.type === 'numeric')
      .map(([name]) => name);
    const categoricalColumns = Object.entries(analysis.columns)
      .filter(([_, info]) => info.type === 'categorical')
      .map(([name]) => name);

    // Check for required 2D types
    this.settings.requiredTypes['2d'].forEach(type => {
      if (!existingTypes.has(type)) {
        const suggestion = this.createDefaultVisualization(type, {
          numericColumns,
          categoricalColumns
        });
        if (suggestion) requiredSuggestions.push(suggestion);
      }
    });

    // Check for required 3D types if we have enough numeric columns
    if (numericColumns.length >= 3) {
      this.settings.requiredTypes['3d'].forEach(type => {
        if (!existingTypes.has(type)) {
          const suggestion = this.create3DVisualization(type, numericColumns);
          if (suggestion) requiredSuggestions.push(suggestion);
        }
      });
    }

    return requiredSuggestions;
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

    const categoricalColumns = Object.entries(analysis.columns)
      .filter(([_, info]) => info.type === 'categorical')
      .map(([name]) => name);

    if (numericColumns.length < 1) return [];

    const defaults = [];

    // Add 2D defaults
    this.settings.defaultSuggestions['2d'].forEach(type => {
      const suggestion = this.createDefaultVisualization(type, {
        numericColumns,
        categoricalColumns
      });
      if (suggestion) defaults.push(suggestion);
    });

    // Add 3D if enough numeric columns
    if (numericColumns.length >= 3) {
      this.settings.defaultSuggestions['3d'].forEach(type => {
        const suggestion = this.create3DVisualization(type, numericColumns);
        if (suggestion) defaults.push(suggestion);
      });
    }

    return defaults;
  }

  createDefaultVisualization(type, { numericColumns, categoricalColumns }) {
    const baseConfig = {
      id: `default-${type}`,
      type,
      score: 0.7
    };

    switch (type) {
      case 'bar':
        if (!categoricalColumns.length || !numericColumns.length) return null;
        return {
          ...baseConfig,
          title: 'Category Comparison',
          description: 'Compare values across categories',
          columns: {
            x: categoricalColumns[0],
            y: numericColumns[0]
          },
          visualization: {
            type,
            config: {
              x: categoricalColumns[0],
              y: numericColumns[0]
            }
          }
        };

      case 'scatter':
        if (numericColumns.length < 2) return null;
        return {
          ...baseConfig,
          title: 'Correlation Analysis',
          description: 'Explore relationships between variables',
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
        };

      case 'line':
        if (numericColumns.length < 2) return null;
        return {
          ...baseConfig,
          title: 'Trend Analysis',
          description: 'Analyze trends and patterns',
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
        };

      case 'pie':
        if (!categoricalColumns.length) return null;
        return {
          ...baseConfig,
          title: 'Distribution Analysis',
          description: 'View category distribution',
          columns: {
            dimension: categoricalColumns[0]
          },
          visualization: {
            type,
            config: {
              dimension: categoricalColumns[0]
            }
          }
        };

      default:
        return null;
    }
  }

  create3DVisualization(type, numericColumns) {
    if (numericColumns.length < 3) return null;

    return {
      id: `default-${type}`,
      type,
      score: 0.7,
      title: `3D ${type} Visualization`,
      description: 'Explore relationships in three dimensions',
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
    };
  }
}

export const visualizationManager = new VisualizationManager();
export default visualizationManager;