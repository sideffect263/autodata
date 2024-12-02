// src/services/brain/analyzers/visualizationSuggester.js
import { categoricalRules } from './rules/categoricalRules';
import { timeSeriesRules } from './rules/timeSeriesRules';
import { relationshipRules } from './rules/relationshipRules';
import { numericalRules3D } from './rules/numerical3DRules';

export class VisualizationSuggester {
  constructor() {
    this.initialized = false;
    this.suggestions = [];
    this.rules = new Map();
    this.userPreferences = new Map();
    this.currentData = null;
    this.currentColumns = null;
    
    this.settings = {
      minConfidenceScore: 0.6,
      maxSuggestionsPerType: 3,
      maxTotalSuggestions: 10,
      complexityPenalty: 0.1,
      dimensionalityBonus: 0.1
    };

    // Initialize rules in constructor
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

      this.currentData = data;
      this.currentColumns = columns;
      this.userPreferences = preferences;

      // Generate different types of suggestions
      const suggestions = [
        ...this.generateCategoricalSuggestions(),
        ...this.generateNumericSuggestions(),
        ...this.generateTimeSeriesSuggestions(),
        ...this.generate3DSuggestions()
      ];

      // Score and filter suggestions
      return this.scoreSuggestions(suggestions, patterns);

    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

 // In visualizationSuggester.js, update the generate method for bar charts
generateCategoricalSuggestions() {
  const suggestions = [];
  const categoricalColumns = Object.entries(this.currentColumns)
    .filter(([_, info]) => info?.type === 'categorical')
    .map(([name]) => name);

  const numericColumns = Object.entries(this.currentColumns)
    .filter(([_, info]) => info?.type === 'numeric')
    .map(([name]) => name);

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
            y: numColumn
          }
        },
        score: 0.8
      });
    });
  });

  return suggestions;
}

  generateNumericSuggestions() {
    const suggestions = [];
    const numericColumns = Object.entries(this.currentColumns)
      .filter(([_, info]) => info?.type === 'numeric')
      .map(([name]) => name);

    if (numericColumns.length >= 2) {
      const rules = this.rules.get('relationship') || [];
      rules.forEach(rule => {
        try {
          // For each rule, create appropriate column combinations
          if (rule.type === 'scatter') {
            // For scatter plots, create pairs of columns
            for (let i = 0; i < numericColumns.length - 1; i++) {
              for (let j = i + 1; j < numericColumns.length; j++) {
                const columnPair = [numericColumns[i], numericColumns[j]];
                if (rule.conditions(columnPair)) {
                  suggestions.push({
                    id: `${rule.type}-${columnPair.join('-')}`,
                    type: rule.type,
                    title: `${rule.title}: ${columnPair.join(' vs ')}`,
                    description: rule.description,
                    columns: columnPair,
                    visualization: rule.generate(columnPair, this.currentData),
                    score: rule.score
                  });
                }
              }
            }
          } else if (rule.type === 'bubble' && numericColumns.length >= 3) {
            // For bubble charts, create triplets of columns
            for (let i = 0; i < numericColumns.length - 2; i++) {
              for (let j = i + 1; j < numericColumns.length - 1; j++) {
                for (let k = j + 1; k < numericColumns.length; k++) {
                  const columnTriplet = [numericColumns[i], numericColumns[j], numericColumns[k]];
                  if (rule.conditions(columnTriplet)) {
                    suggestions.push({
                      id: `${rule.type}-${columnTriplet.join('-')}`,
                      type: rule.type,
                      title: `${rule.title}: ${columnTriplet.join(', ')}`,
                      description: rule.description,
                      columns: columnTriplet,
                      visualization: rule.generate(columnTriplet, this.currentData),
                      score: rule.score
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to generate numeric suggestion:', error);
        }
      });
    }

    return suggestions;
  }

  generateTimeSeriesSuggestions() {
    const suggestions = [];
    const dateColumns = Object.entries(this.currentColumns)
      .filter(([_, info]) => info?.type === 'date')
      .map(([name]) => name);

    const numericColumns = Object.entries(this.currentColumns)
      .filter(([_, info]) => info?.type === 'numeric')
      .map(([name]) => name);

    const rules = this.rules.get('timeSeries') || [];

    dateColumns.forEach(dateColumn => {
      numericColumns.forEach(valueColumn => {
        rules.forEach(rule => {
          try {
            if (rule.conditions([dateColumn, valueColumn])) {
              suggestions.push({
                id: `${rule.type}-${dateColumn}-${valueColumn}`,
                type: rule.type,
                title: `${rule.title}: ${valueColumn} over time`,
                description: rule.description,
                columns: [dateColumn, valueColumn],
                visualization: rule.generate([dateColumn, valueColumn], this.currentData),
                score: rule.score
              });
            }
          } catch (error) {
            console.warn(`Failed to generate time series suggestion for ${dateColumn}, ${valueColumn}:`, error);
          }
        });
      });
    });

    return suggestions;
  }

  generate3DSuggestions() {
    const suggestions = [];
    const numericColumns = Object.entries(this.currentColumns)
      .filter(([_, info]) => info?.type === 'numeric')
      .map(([name]) => name);

    if (numericColumns.length >= 3) {
      const rules = this.rules.get('3d-numeric') || [];
      rules.forEach(rule => {
        try {
          for (let i = 0; i < numericColumns.length - 2; i++) {
            for (let j = i + 1; j < numericColumns.length - 1; j++) {
              for (let k = j + 1; k < numericColumns.length; k++) {
                const columns = [numericColumns[i], numericColumns[j], numericColumns[k]];
                if (rule.conditions(columns)) {
                  suggestions.push({
                    id: `${rule.type}-${columns.join('-')}`,
                    type: rule.type,
                    title: `${rule.title}: ${columns.join(', ')}`,
                    description: rule.description,
                    columns: columns,
                    visualization: rule.generate(columns, this.currentData),
                    score: rule.score,
                    dimensions: 3
                  });
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to generate 3D suggestion:', error);
        }
      });
    }

    return suggestions;
  }

  scoreSuggestions(suggestions) {
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        finalScore: this.calculateSuggestionScore(suggestion)
      }))
      .filter(suggestion => suggestion.finalScore >= this.settings.minConfidenceScore)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, this.settings.maxTotalSuggestions);
  }

 // Update this method in your VisualizationSuggester class
calculateSuggestionScore(suggestion) {
  const baseScore = suggestion.score || 0.5;
  const complexity = suggestion.dimensions === 3 ? this.settings.complexityPenalty : 0;
  const dimensionality = suggestion.dimensions === 3 ? this.settings.dimensionalityBonus : 0;
  
  // Fix preference handling
  let preference = 0.5;
  if (this.userPreferences && typeof this.userPreferences === 'object') {
    preference = this.userPreferences[suggestion.type] || 0.5;
  }

  return Math.min(1, Math.max(0,
    baseScore * 0.4 +
    preference * 0.3 +
    (1 - complexity) * 0.2 +
    dimensionality * 0.1
  ));
}

  validateInput(data, columns) {
    return data && 
           Array.isArray(data) && 
           data.length > 0 && 
           columns && 
           Object.keys(columns).length > 0;
  }
}

export const visualizationSuggester = new VisualizationSuggester();
export default visualizationSuggester;