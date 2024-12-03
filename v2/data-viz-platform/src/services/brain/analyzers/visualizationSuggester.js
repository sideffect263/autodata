// src/services/brain/analyzers/visualizationSuggester.js
import { categoricalRules } from './rules/categoricalRules';
import { timeSeriesRules } from './rules/timeSeriesRules';
import { relationshipRules } from './rules/relationshipRules';
import { numericalRules3D } from './rules/numerical3DRules';

export class VisualizationSuggester {
  constructor() {
    this.initialized = false;
    this.rules = new Map();
    this.settings = {
      minConfidenceScore: 0.6,
      maxSuggestionsPerType: 3,
      maxTotalSuggestions: 10,
      complexityPenalty: 0.1,
      dimensionalityBonus: 0.1,
      requiredColumns: {
        bar: ['numeric', 'categorical'],
        line: ['numeric', 'numeric'],
        scatter: ['numeric', 'numeric'],
        pie: ['categorical'],
        scatter3d: ['numeric', 'numeric', 'numeric'],
        surface: ['numeric', 'numeric', 'numeric'],
        bar3d: ['numeric', 'numeric', 'numeric']
      }
    };

    this.initializeRules();
  }

  initializeRules() {
    this.rules.set('categorical', categoricalRules);
    this.rules.set('timeSeries', timeSeriesRules);
    this.rules.set('relationship', relationshipRules);
    this.rules.set('3d-numeric', numericalRules3D);
  }

  async initialize(options = {}) {
    if (this.initialized) return;

    try {
      this.settings = {
        ...this.settings,
        ...options
      };

      this.initialized = true;
    } catch (error) {
      console.error('VisualizationSuggester initialization failed:', error);
      throw error;
    }
  }

  async generateSuggestions(data, columns, patterns, preferences = new Map()) {
    try {
      if (!this.validateInput(data, columns)) {
        throw new Error('Invalid input data or columns');
      }

      // Generate all possible suggestions
      const suggestions = [
        ...this.generateCategoricalSuggestions(data, columns),
        ...this.generateNumericSuggestions(data, columns),
        ...this.generateTimeSeriesSuggestions(data, columns),
        ...this.generate3DSuggestions(data, columns)
      ];

      // Add preference and pattern scores
      return this.enhanceSuggestions(suggestions, patterns, preferences);

    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  generateTimeSeriesSuggestions(data, columns) {
    const suggestions = [];
    const dateColumns = this.getColumnsByType(columns, 'date');
    const numericColumns = this.getColumnsByType(columns, 'numeric');

    if (dateColumns.length === 0 || numericColumns.length === 0) return suggestions;

    // For each date column, generate time series visualizations with numeric columns
    dateColumns.forEach(dateColumn => {
      numericColumns.forEach(valueColumn => {
        // Add line chart suggestion
        suggestions.push({
          id: `timeseries-line-${dateColumn}-${valueColumn}`,
          type: 'line',
          title: `${valueColumn} Trends Over Time`,
          description: `Analyze how ${valueColumn} changes over time`,
          columns: {
            x: dateColumn,
            y: valueColumn
          },
          visualization: {
            type: 'line',
            config: {
              x: dateColumn,
              y: valueColumn,
              smooth: true,
              showPoints: true,
              connectNulls: true
            }
          },
          score: 0.9,
          insights: this.generateTimeSeriesInsights(data, columns, dateColumn, valueColumn)
        });

        // Add bar chart for discrete time periods
        if (this.isDiscreteTimePeriod(data, dateColumn)) {
          suggestions.push({
            id: `timeseries-bar-${dateColumn}-${valueColumn}`,
            type: 'bar',
            title: `${valueColumn} by Time Period`,
            description: `Compare ${valueColumn} across time periods`,
            columns: {
              x: dateColumn,
              y: valueColumn
            },
            visualization: {
              type: 'bar',
              config: {
                x: dateColumn,
                y: valueColumn,
                orientation: 'vertical'
              }
            },
            score: 0.8,
            insights: this.generateTimeSeriesInsights(data, columns, dateColumn, valueColumn)
          });
        }
      });
    });

    return suggestions;
  }

  // Helper method to detect if time data is discrete
  isDiscreteTimePeriod(data, dateColumn) {
    try {
      const dates = data.map(row => new Date(row[dateColumn]));
      const sortedDates = dates.sort((a, b) => a - b);
      
      // Check the gaps between dates
      const gaps = new Set();
      for (let i = 1; i < sortedDates.length; i++) {
        const gap = sortedDates[i] - sortedDates[i-1];
        gaps.add(gap);
      }

      // If we have consistent gaps and not too many unique dates,
      // consider it discrete (e.g., monthly, yearly data)
      return gaps.size <= 3 && sortedDates.length <= 50;
    } catch (error) {
      console.warn('Error checking time period discreteness:', error);
      return false;
    }
  }

  // Helper method to generate time series insights
  generateTimeSeriesInsights(data, columns, dateColumn, valueColumn) {
    try {
      const timeValues = data.map(row => ({
        date: new Date(row[dateColumn]),
        value: Number(row[valueColumn])
      }))
      .sort((a, b) => a.date - b.date)
      .filter(item => !isNaN(item.value));

      if (timeValues.length < 2) return [];

      const insights = [];
      
      // Detect overall trend
      const firstValue = timeValues[0].value;
      const lastValue = timeValues[timeValues.length - 1].value;
      const totalChange = ((lastValue - firstValue) / firstValue) * 100;

      if (Math.abs(totalChange) > 10) {
        insights.push({
          type: 'trend',
          description: `Overall ${totalChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(totalChange).toFixed(1)}% over the time period`,
          importance: Math.min(Math.abs(totalChange) / 100, 1)
        });
      }

      return insights;

    } catch (error) {
      console.warn('Error generating time series insights:', error);
      return [];
    }
  }

  generateCategoricalSuggestions(data, columns) {
    const suggestions = [];
    const categoricalColumns = this.getColumnsByType(columns, 'categorical');
    const numericColumns = this.getColumnsByType(columns, 'numeric');

    if (categoricalColumns.length === 0) return suggestions;

    // Add bar chart suggestions
    categoricalColumns.forEach(catColumn => {
      numericColumns.forEach(numColumn => {
        suggestions.push({
          id: `bar-${catColumn}-${numColumn}`,
          type: 'bar',
          title: `${catColumn} by ${numColumn}`,
          description: `Compare ${numColumn} across different ${catColumn} categories`,
          columns: {
            x: catColumn,
            y: numColumn
          },
          visualization: {
            type: 'bar',
            config: {
              x: catColumn,
              y: numColumn,
              orientation: 'vertical'
            }
          },
          score: 0.8,
          insights: this.generateColumnInsights(data, columns, catColumn, numColumn)
        });
      });

      // Add pie chart suggestions
      suggestions.push({
        id: `pie-${catColumn}`,
        type: 'pie',
        title: `Distribution of ${catColumn}`,
        description: `View the distribution of categories in ${catColumn}`,
        columns: {
          dimension: catColumn
        },
        visualization: {
          type: 'pie',
          config: {
            dimension: catColumn,
            showPercentages: true
          }
        },
        score: 0.75,
        insights: this.generateCategoryDistributionInsights(data, columns, catColumn)
      });
    });

    return suggestions;
  }

  generateNumericSuggestions(data, columns) {
    const suggestions = [];
    const numericColumns = this.getColumnsByType(columns, 'numeric');

    if (numericColumns.length < 2) return suggestions;

    // Generate scatter plots
    for (let i = 0; i < numericColumns.length - 1; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        suggestions.push({
          id: `scatter-${numericColumns[i]}-${numericColumns[j]}`,
          type: 'scatter',
          title: `${numericColumns[i]} vs ${numericColumns[j]}`,
          description: 'Explore correlation between variables',
          columns: {
            x: numericColumns[i],
            y: numericColumns[j]
          },
          visualization: {
            type: 'scatter',
            config: {
              x: numericColumns[i],
              y: numericColumns[j],
              showTrendline: true
            }
          },
          score: 0.85,
          insights: this.generateCorrelationInsights(data, columns, numericColumns[i], numericColumns[j])
        });

        // Add line chart if data might represent a trend
        if (this.mightRepresentTrend(data, numericColumns[i], numericColumns[j])) {
          suggestions.push({
            id: `line-${numericColumns[i]}-${numericColumns[j]}`,
            type: 'line',
            title: `${numericColumns[j]} over ${numericColumns[i]}`,
            description: 'Analyze trends over values',
            columns: {
              x: numericColumns[i],
              y: numericColumns[j]
            },
            visualization: {
              type: 'line',
              config: {
                x: numericColumns[i],
                y: numericColumns[j],
                showPoints: true
              }
            },
            score: 0.8,
            insights: this.generateTrendInsights(data, columns, numericColumns[i], numericColumns[j])
          });
        }
      }
    }

    return suggestions;
  }

  generate3DSuggestions(data, columns) {
    const suggestions = [];
    const numericColumns = this.getColumnsByType(columns, 'numeric');

    if (numericColumns.length < 3) return suggestions;

    // Generate 3D visualizations for each combination of numeric columns
    for (let i = 0; i < numericColumns.length - 2; i++) {
      for (let j = i + 1; j < numericColumns.length - 1; j++) {
        for (let k = j + 1; k < numericColumns.length; k++) {
          const columnSet = [numericColumns[i], numericColumns[j], numericColumns[k]];

          // 3D Scatter Plot
          suggestions.push({
            id: `scatter3d-${columnSet.join('-')}`,
            type: 'scatter3d',
            title: '3D Relationship Analysis',
            description: `Explore relationships between ${columnSet.join(', ')}`,
            columns: {
              x: columnSet[0],
              y: columnSet[1],
              z: columnSet[2]
            },
            visualization: {
              type: 'scatter3d',
              dimensions: 3,
              config: {
                x: columnSet[0],
                y: columnSet[1],
                z: columnSet[2]
              }
            },
            score: 0.9,
            insights: this.generate3DInsights(data, columns, columnSet)
          });

          // 3D Surface Plot if appropriate
          if (this.isSuitableForSurface(data, columnSet)) {
            suggestions.push({
              id: `surface-${columnSet.join('-')}`,
              type: 'surface',
              title: '3D Surface Analysis',
              description: `Visualize surface relationships between ${columnSet.join(', ')}`,
              columns: {
                x: columnSet[0],
                y: columnSet[1],
                z: columnSet[2]
              },
              visualization: {
                type: 'surface',
                dimensions: 3,
                config: {
                  x: columnSet[0],
                  y: columnSet[1],
                  z: columnSet[2],
                  wireframe: true
                }
              },
              score: 0.85,
              insights: this.generateSurfaceInsights(data, columns, columnSet)
            });
          }
        }
      }
    }

    return suggestions;
  }

  getColumnsByType(columns, type) {
    return Object.entries(columns)
      .filter(([_, info]) => info.type === type)
      .map(([name]) => name);
  }

  enhanceSuggestions(suggestions, patterns, preferences) {
    return suggestions.map(suggestion => ({
      ...suggestion,
      score: this.calculateFinalScore(suggestion, patterns, preferences)
    }));
  }

  calculateFinalScore(suggestion, patterns, preferences) {
    const baseScore = suggestion.score || 0.5;
    const patternScore = this.getPatternScore(suggestion, patterns);
    const preferenceScore = this.getPreferenceScore(suggestion, preferences);
    const dimensionalityBonus = suggestion.visualization?.dimensions === 3 ? 
      this.settings.dimensionalityBonus : 0;

    return Math.min(1, Math.max(0,
      baseScore * 0.4 +
      patternScore * 0.3 +
      preferenceScore * 0.2 +
      dimensionalityBonus
    ));
  }

  // Utility methods
  mightRepresentTrend(data, x, y) {
    // Check if x values are monotonic
    const xValues = data.map(d => d[x]).sort((a, b) => a - b);
    return xValues.every((val, i) => i === 0 || val >= xValues[i - 1]);
  }

  isSuitableForSurface(data, columns) {
    // Check if data points form a grid-like structure
    return true; // Implement actual logic based on data distribution
  }

  validateInput(data, columns) {
    return data && 
           Array.isArray(data) && 
           data.length > 0 && 
           columns && 
           Object.keys(columns).length > 0;
  }

  // Insight generation methods
  generateColumnInsights(data, columns, col1, col2) {
    // Implement insight generation logic
    return [];
  }

  generateCategoryDistributionInsights(data, columns, column) {
    // Implement distribution insight logic
    return [];
  }

  generateCorrelationInsights(data, columns, col1, col2) {
    // Implement correlation insight logic
    return [];
  }

  generateTrendInsights(data, columns, col1, col2) {
    // Implement trend insight logic
    return [];
  }

  generate3DInsights(data, columns, columnSet) {
    // Implement 3D insight logic
    return [];
  }

  getPatternScore(suggestion, patterns) {
    if (!patterns) return 0;

    try {
      // Check for column-specific patterns
      const columns = Object.values(suggestion.columns);
      const relevantPatterns = patterns.filter(pattern => 
        columns.includes(pattern.column) || 
        pattern.columns?.some(col => columns.includes(col))
      );

      if (relevantPatterns.length === 0) return 0;

      // Calculate score based on pattern types and visualization type
      let score = 0;
      relevantPatterns.forEach(pattern => {
        switch (pattern.type) {
          case 'correlation':
            if (suggestion.type === 'scatter') {
              score += Math.abs(pattern.coefficient) || 0.5;
            }
            break;
          
          case 'trend':
            if (suggestion.type === 'line') {
              score += pattern.strength || 0.5;
            }
            break;
          
          case 'distribution':
            if (suggestion.type === 'pie' || suggestion.type === 'bar') {
              score += pattern.confidence || 0.5;
            }
            break;
          
          case 'timeSeries':
            if (suggestion.type === 'line' || suggestion.type === 'bar') {
              score += pattern.confidence || 0.5;
            }
            break;

          case '3d-relationship':
            if (suggestion.visualization?.dimensions === 3) {
              score += pattern.strength || 0.5;
            }
            break;
        }
      });

      // Normalize score
      return Math.min(score / relevantPatterns.length, 1);
    } catch (error) {
      console.warn('Error calculating pattern score:', error);
      return 0;
    }
  }

  getPreferenceScore(suggestion, preferences) {
    if (!preferences || !(preferences instanceof Map)) return 0.5;

    try {
      let score = 0.5; // Default neutral score

      // Check visualization type preference
      const typePreference = preferences.get(`type_${suggestion.type}`);
      if (typeof typePreference === 'number') {
        score += typePreference * 0.3;
      }

      // Check dimension preference
      const dimensionPreference = preferences.get(
        `dimensions_${suggestion.visualization?.dimensions || 2}`
      );
      if (typeof dimensionPreference === 'number') {
        score += dimensionPreference * 0.2;
      }

      // Check column preferences
      const columns = Object.values(suggestion.columns);
      const columnPreferences = columns.map(col => 
        preferences.get(`column_${col}`) || 0
      );
      if (columnPreferences.length > 0) {
        const avgColumnPreference = columnPreferences.reduce((a, b) => a + b, 0) / columnPreferences.length;
        score += avgColumnPreference * 0.2;
      }

      // Normalize final score
      return Math.min(Math.max(score, 0), 1);
    } catch (error) {
      console.warn('Error calculating preference score:', error);
      return 0.5;
    }
  }

  generateSurfaceInsights(data, columns, columnSet) {
    // Implement surface insight logic
    return [];
  }
}

export const visualizationSuggester = new VisualizationSuggester();
export default visualizationSuggester;