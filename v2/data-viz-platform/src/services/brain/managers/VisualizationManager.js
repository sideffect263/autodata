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
        '3d': ['scatter', 'bar', 'surface']
      },
      defaultSuggestions: {
        '2d': ['bar', 'line', 'scatter'],
        '3d': ['scatter', 'surface']
      }
    };
  }

  async initialize(settings = {}) {
    this.settings = { ...this.settings, ...settings };
    await this.suggester.initialize(settings);
  }

  async generateSuggestions(data, analysis, preferences) {
    try {
      const suggestions = await this.suggester.generateSuggestions(data, analysis.columns, analysis.patterns, preferences);
      const existingTypes = new Set(suggestions.map(s => s.type));
      const requiredSuggestions = this.generateRequiredSuggestions(data, analysis, existingTypes);
      const allSuggestions = [...suggestions, ...requiredSuggestions];
      
      return this.filterAndRankSuggestions(allSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return this.generateDefaultSuggestions(data, analysis);
    }
  }

  generateRequiredSuggestions(data, analysis, existingTypes) {
    const numericColumns = Object.entries(analysis.columns)
      .filter(([_, info]) => info.type === 'numeric')
      .map(([name]) => name);
    const categoricalColumns = Object.entries(analysis.columns)
      .filter(([_, info]) => info.type === 'categorical')
      .map(([name]) => name);

    const requiredSuggestions = [];

    // Add 2D suggestions
    this.settings.requiredTypes['2d'].forEach(type => {
      if (!existingTypes.has(type)) {
        const suggestion = this.createDefaultVisualization(type, {
          numericColumns,
          categoricalColumns
        });
        if (suggestion) requiredSuggestions.push(suggestion);
      }
    });

    // Add 3D suggestions if enough numeric columns
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

  create3DVisualization(type, numericColumns) {
    if (numericColumns.length < 3) return null;

    const baseConfig = {
      id: `default-${type}`,
      type,
      score: 0.7,
      dimensions: 3
    };

    switch (type) {
      case 'scatter':
        return {
          ...baseConfig,
          title: '3D Scatter Plot',
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
              z: numericColumns[2],
              pointSize: 0.5,
              opacity: 1,
              colorBy: null,
              sizeBy: null
            }
          }
        };

      case 'bar':
        return {
          ...baseConfig,
          title: '3D Bar Chart',
          description: 'Compare values in three dimensions',
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
              z: numericColumns[2],
              height: numericColumns[1],
              spacing: 0.2,
              normalizeHeight: true
            }
          }
        };

      case 'surface':
        return {
          ...baseConfig,
          title: '3D Surface Plot',
          description: 'Visualize data as a continuous surface',
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
              z: numericColumns[2],
              resolution: 50,
              wireframe: false,
              colorScheme: 'default'
            }
          }
        };

      default:
        return null;
    }
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
      case 'line':
        if (numericColumns.length < 2) return null;
        return {
          ...baseConfig,
          title: type === 'scatter' ? 'Correlation Analysis' : 'Trend Analysis',
          description: type === 'scatter' ? 'Explore relationships between variables' : 'Analyze trends and patterns',
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

  filterAndRankSuggestions(suggestions) {
    return suggestions
      .filter(s => s.score >= this.settings.minConfidence)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.settings.maxSuggestions);
  }
}

export const visualizationManager = new VisualizationManager();
export default visualizationManager;