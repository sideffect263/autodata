// src/services/brain/analyzers/visualizationSuggester.js

export class VisualizationSuggester {
  constructor() {
    this.suggestions = [];
    this.rules = new Map();
    this.userPreferences = new Map();
    this.initializeRules();
  }

  /**
   * Initialize core visualization rules and scoring criteria
   */
  initializeRules() {
    // Single-column visualization rules
    this.rules.set('numeric', [
      {
        type: 'histogram',
        score: 0.8,
        title: 'Distribution Analysis',
        description: 'Analyze value distribution patterns',
        conditions: (column) => column.stats.distinct > 10,
        generate: (column) => ({
          type: 'histogram',
          config: {
            x: column.name,
            binCount: this.calculateOptimalBins(column.stats.distinct),
            showMean: true,
            showMedian: true
          }
        })
      },
      {
        type: 'boxplot',
        score: 0.75,
        title: 'Statistical Summary',
        description: 'View statistical distribution and outliers',
        conditions: (column) => true,
        generate: (column) => ({
          type: 'boxplot',
          config: {
            x: column.name,
            showOutliers: true,
            showStats: true
          }
        })
      },
      {
        type: 'density',
        score: 0.7,
        title: 'Density Distribution',
        description: 'Smooth distribution visualization',
        conditions: (column) => column.stats.distinct > 50,
        generate: (column) => ({
          type: 'density',
          config: {
            x: column.name,
            smoothing: 'auto'
          }
        })
      }
    ]);

    // Categorical data rules
    this.rules.set('categorical', [
      {
        type: 'bar',
        score: 0.9,
        title: 'Category Comparison',
        description: 'Compare frequencies across categories',
        conditions: (column) => column.stats.distinct <= 20,
        generate: (column) => ({
          type: 'bar',
          config: {
            x: column.name,
            y: 'count',
            sort: 'descending'
          }
        })
      },
      {
        type: 'pie',
        score: 0.7,
        title: 'Category Distribution',
        description: 'Show proportion of each category',
        conditions: (column) => column.stats.distinct <= 10,
        generate: (column) => ({
          type: 'pie',
          config: {
            dimension: column.name,
            showPercentage: true,
            minSlice: 0.02
          }
        })
      },
      {
        type: 'treemap',
        score: 0.6,
        title: 'Hierarchical View',
        description: 'Visualize category hierarchies',
        conditions: (column) => column.stats.distinct > 10 && column.stats.distinct <= 30,
        generate: (column) => ({
          type: 'treemap',
          config: {
            dimension: column.name,
            showValues: true
          }
        })
      }
    ]);

    // Time series rules
    this.rules.set('date', [
      {
        type: 'line',
        score: 0.9,
        title: 'Trend Analysis',
        description: 'Track changes over time',
        conditions: (column) => true,
        generate: (column, metadata) => ({
          type: 'line',
          config: {
            x: column.name,
            y: metadata.suggestedMetric,
            interpolation: 'monotone',
            showTrend: true
          }
        })
      },
      {
        type: 'area',
        score: 0.8,
        title: 'Cumulative Trend',
        description: 'View cumulative changes over time',
        conditions: (column, metadata) => metadata.isCumulative,
        generate: (column, metadata) => ({
          type: 'area',
          config: {
            x: column.name,
            y: metadata.suggestedMetric,
            stacked: true
          }
        })
      }
    ]);

    // Multi-column relationship rules
    this.rules.set('relationship', [
      {
        type: 'scatter',
        score: 0.85,
        title: 'Correlation Analysis',
        description: 'Explore relationships between variables',
        conditions: (columns) => 
          columns.every(col => col.type === 'numeric') && 
          columns.length === 2,
        generate: (columns) => ({
          type: 'scatter',
          config: {
            x: columns[0].name,
            y: columns[1].name,
            showTrendline: true,
            showCorrelation: true
          }
        })
      },
      {
        type: 'heatmap',
        score: 0.8,
        title: 'Correlation Matrix',
        description: 'View relationships among multiple variables',
        conditions: (columns) => 
          columns.every(col => col.type === 'numeric') && 
          columns.length > 2,
        generate: (columns) => ({
          type: 'heatmap',
          config: {
            dimensions: columns.map(col => col.name),
            showValues: true,
            colorScale: 'diverging'
          }
        })
      }
    ]);
  }

  /**
   * Generate visualization suggestions based on data analysis
   */
  async generateSuggestions(data, columns, patterns) {
    try {
      this.suggestions = [];

      // Single column visualizations
      for (const [columnName, columnInfo] of Object.entries(columns)) {
        this.suggestions.push(...this.generateColumnSuggestions(columnInfo));
      }

      // Relationship visualizations
      this.suggestions.push(...this.generateRelationshipSuggestions(columns, patterns));

      // Time series visualizations
      if (patterns.timeSeries?.length > 0) {
        this.suggestions.push(...this.generateTimeSeriesSuggestions(patterns.timeSeries));
      }

      // Distribution-based visualizations
      if (patterns.distributions?.length > 0) {
        this.suggestions.push(...this.generateDistributionSuggestions(patterns.distributions));
      }

      // Apply user preferences
      this.applyUserPreferences();

      // Sort by final score
      this.suggestions.sort((a, b) => b.finalScore - a.finalScore);

      return this.suggestions;
    } catch (error) {
      console.error('Error generating visualization suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate suggestions for a single column
   */
  generateColumnSuggestions(columnInfo) {
    const suggestions = [];
    const rules = this.rules.get(columnInfo.type) || [];

    for (const rule of rules) {
      if (rule.conditions(columnInfo)) {
        suggestions.push({
          id: `${rule.type}-${columnInfo.name}`,
          type: rule.type,
          title: `${rule.title}: ${columnInfo.name}`,
          description: rule.description,
          baseScore: rule.score,
          relevance: this.calculateRelevance(columnInfo, rule),
          visualization: rule.generate(columnInfo),
          metadata: {
            column: columnInfo.name,
            complexity: this.calculateComplexity(rule.type),
            interactivity: this.getInteractivityOptions(rule.type)
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate suggestions for relationships between columns
   */
  generateRelationshipSuggestions(columns, patterns) {
    const suggestions = [];
    const relationshipRules = this.rules.get('relationship') || [];

    // Handle correlations
    if (patterns.correlations) {
      for (const correlation of patterns.correlations) {
        const relevantColumns = correlation.columns.map(col => columns[col]);
        
        for (const rule of relationshipRules) {
          if (rule.conditions(relevantColumns)) {
            suggestions.push({
              id: `${rule.type}-${correlation.columns.join('-')}`,
              type: rule.type,
              title: `${rule.title}: ${correlation.columns.join(' vs ')}`,
              description: `${rule.description} (${correlation.strength} correlation)`,
              baseScore: rule.score * Math.abs(correlation.coefficient),
              relevance: this.calculateRelevance(relevantColumns, rule),
              visualization: rule.generate(relevantColumns),
              metadata: {
                columns: correlation.columns,
                correlation: correlation.coefficient,
                significance: correlation.significance
              }
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate suggestions for time series patterns
   */
  generateTimeSeriesSuggestions(timeSeriesPatterns) {
    const suggestions = [];
    const timeSeriesRules = this.rules.get('date') || [];

    for (const pattern of timeSeriesPatterns) {
      for (const rule of timeSeriesRules) {
        if (rule.conditions(pattern)) {
          suggestions.push({
            id: `${rule.type}-${pattern.dateColumn}-${pattern.valueColumn}`,
            type: rule.type,
            title: `${rule.title}: ${pattern.valueColumn} over time`,
            description: this.generateTimeSeriesDescription(pattern),
            baseScore: rule.score * pattern.confidence,
            visualization: rule.generate(pattern),
            metadata: {
              timePattern: pattern,
              recommendations: pattern.recommendations
            }
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Calculate visualization complexity
   */
  calculateComplexity(visType) {
    const complexityScores = {
      bar: 1,
      pie: 1,
      line: 2,
      scatter: 2,
      histogram: 2,
      heatmap: 3,
      treemap: 3,
      boxplot: 3
    };

    return complexityScores[visType] || 2;
  }

  /**
   * Get available interactivity options
   */
  getInteractivityOptions(visType) {
    const baseOptions = ['tooltip', 'zoom', 'pan'];
    const additionalOptions = {
      scatter: ['brush', 'lasso', 'pointSelection'],
      heatmap: ['cellSelection', 'rowColumnSelection'],
      treemap: ['drilldown', 'nodeSelection']
    };

    return [...baseOptions, ...(additionalOptions[visType] || [])];
  }

  /**
   * Calculate relevance score for a visualization
   */
  calculateRelevance(columnInfo, rule) {
    let relevance = 1.0;

    // Adjust based on data characteristics
    if (Array.isArray(columnInfo)) {
      // Multiple columns
      relevance *= this.calculateMultiColumnRelevance(columnInfo, rule);
    } else {
      // Single column
      relevance *= this.calculateSingleColumnRelevance(columnInfo, rule);
    }

    return Math.min(1, relevance);
  }

  /**
   * Calculate relevance for a single column
   */
  calculateSingleColumnRelevance(columnInfo, rule) {
    let relevance = 1.0;

    // Adjust based on column type
    switch (columnInfo.type) {
      case 'numeric':
        relevance *= this.calculateNumericColumnRelevance(columnInfo, rule);
        break;
      case 'categorical':
        relevance *= this.calculateCategoricalColumnRelevance(columnInfo, rule);
        break;
      case 'date':
        relevance *= this.calculateDateColumnRelevance(columnInfo, rule);
        break;
      default:
        relevance *= 0.5; // Default to lower relevance for unknown types
        break;
    }

    // Adjust based on other column characteristics
    if (columnInfo.stats.distinct <= 10) {
      relevance *= 0.8; // Lower relevance for low cardinality
    }

    if (columnInfo.nullCount / columnInfo.unique > 0.2) {
      relevance *= 0.7; // Lower relevance for high null values
    }

    return relevance;
  }

  /**
   * Calculate relevance for multiple columns
   */
  calculateMultiColumnRelevance(columns, rule) {
    let relevance = 1.0;

    // Adjust based on column types
    const columnTypes = new Set(columns.map(col => col.type));
    if (columnTypes.size === 1) {
      // All columns are of the same type
      switch (columnTypes.values().next().value) {
        case 'numeric':
          relevance *= this.calculateNumericColumnsRelevance(columns, rule);
          break;
        case 'categorical':
          relevance *= this.calculateCategoricalColumnsRelevance(columns, rule);
          break;
        case 'date':
          relevance *= this.calculateDateColumnsRelevance(columns, rule);
          break;
      }
    } else {
      // Mixed column types
      relevance *= 0.7;
    }

    // Adjust based on number of columns
    if (columns.length > 2) {
      relevance *= 0.8; // Lower relevance for more than 2 columns
    }

    return relevance;
  }

  /**
   * Calculate relevance for numeric columns
   */
  calculateNumericColumnRelevance(column, rule) {
    let relevance = 1.0;

    // Adjust based on cardinality
    if (column.stats.distinct <= 10) {
      relevance *= 0.6; // Lower relevance for low cardinality
    } else if (column.stats.distinct <= 50) {
      relevance *= 0.8; // Moderate relevance for medium cardinality
    }

    // Adjust based on null values
    if (column.nullCount / column.unique > 0.2) {
      relevance *= 0.7; // Lower relevance for high null values
    }

    return relevance;
  }

  /**
   * Calculate relevance for categorical columns
   */
  calculateCategoricalColumnRelevance(column, rule) {
    let relevance = 1.0;

    // Adjust based on cardinality
    if (column.stats.distinct <= 5) {
      relevance *= 0.7; // Lower relevance for very low cardinality
    } else if (column.stats.distinct <= 20) {
      relevance *= 0.9; // Higher relevance for moderate cardinality
    }

    // Adjust based on null values
    if (column.nullCount / column.unique > 0.2) {
      relevance *= 0.7; // Lower relevance for high null values
    }

    return relevance;
  }

  /**
   * Calculate relevance for date columns
   */
  calculateDateColumnRelevance(column, rule) {
    let relevance = 1.0;

    // Adjust based on null values
    if (column.nullCount / column.unique > 0.2) {
      relevance *= 0.7; // Lower relevance for high null values
    }

    return relevance;
  }

  /**
   * Calculate relevance for multiple numeric columns
   */
  calculateNumericColumnsRelevance(columns, rule) {
    let relevance = 1.0;

    // Adjust based on cardinality
    const distinctCounts = columns.map(col => col.stats.distinct);
    const minDistinctCount = Math.min(...distinctCounts);
    const maxDistinctCount = Math.max(...distinctCounts);
    if (minDistinctCount <= 10 || maxDistinctCount <= 10) {
      relevance *= 0.6; // Lower relevance for low cardinality
    } else if (minDistinctCount <= 50 || maxDistinctCount <= 50) {
            relevance *= 0.8; // Moderate relevance for medium cardinality
    }

    // Adjust based on null values
    const nullRatios = columns.map(col => col.nullCount / col.unique);
    const maxNullRatio = Math.max(...nullRatios);
    if (maxNullRatio > 0.2) {
      relevance *= 0.7; // Lower relevance for high null values
    }

    return relevance;
  }

  /**
   * Calculate relevance for multiple categorical columns
   */
  calculateCategoricalColumnsRelevance(columns, rule) {
    let relevance = 1.0;

    // Adjust based on cardinality
    const distinctCounts = columns.map(col => col.stats.distinct);
    const maxDistinctCount = Math.max(...distinctCounts);
    if (maxDistinctCount <= 5) {
      relevance *= 0.7; // Lower relevance for very low cardinality
    } else if (maxDistinctCount <= 20) {
      relevance *= 0.9; // Higher relevance for moderate cardinality
    }

    // Adjust based on null values
    const nullRatios = columns.map(col => col.nullCount / col.unique);
    const maxNullRatio = Math.max(...nullRatios);
    if (maxNullRatio > 0.2) {
      relevance *= 0.7; // Lower relevance for high null values
    }

    return relevance;
  }

  /**
   * Generate description for time series patterns
   */
  generateTimeSeriesDescription(pattern) {
    const descriptionParts = [];
    if (pattern.confidence > 0.8) {
      descriptionParts.push('Highly confident');
    } else if (pattern.confidence > 0.6) {
      descriptionParts.push('Moderately confident');
    } else {
      descriptionParts.push('Low confidence');
    }
    descriptionParts.push('trend identified');
    if (pattern.recommendations && pattern.recommendations.length > 0) {
      descriptionParts.push(`with ${pattern.recommendations.length} recommendations`);
    }

    return descriptionParts.join(' ');
  }

  /**
   * Apply user preferences to adjust scores and suggestions
   */
  applyUserPreferences() {
    for (const suggestion of this.suggestions) {
      if (this.userPreferences.has(suggestion.type)) {
        const preference = this.userPreferences.get(suggestion.type);
        suggestion.finalScore = suggestion.baseScore * preference.weight;
      } else {
        suggestion.finalScore = suggestion.baseScore;
      }
    }
  }

  /**
   * Calculate the optimal number of bins for a histogram
   */
  calculateOptimalBins(distinctCount) {
    return Math.max(10, Math.min(50, Math.ceil(Math.sqrt(distinctCount))));
  }

  /**
   * Generate suggestions for distribution patterns
   */
  generateDistributionSuggestions(distributions) {
    const suggestions = [];
    for (const distribution of distributions) {
      if (distribution.type === 'skewed') {
        suggestions.push({
          id: `distribution-skewed-${distribution.column}`,
          type: 'boxplot',
          title: `Skewness Analysis: ${distribution.column}`,
          description: 'Highlight skewness in distribution',
          baseScore: 0.8,
          visualization: {
            type: 'boxplot',
            config: {
              x: distribution.column,
              highlightSkewness: true
            }
          },
          metadata: {
            distribution
          }
        });
      }
    }
    return suggestions;
  }
}

  // Export singleton instance
  export const visualizationSuggester = new VisualizationSuggester();
  export default visualizationSuggester;