// src/services/brain/analyzers/insightGenerator.js

export class InsightGenerator {
  constructor() {
    this.settings = {
      minConfidenceThreshold: 0.6,
      maxInsightsPerType: 5,
      maxTotalInsights: 20,
      importanceWeights: {
        correlation: 0.8,
        distribution: 0.7,
        outlier: 0.75,
        trend: 0.85,
        categorical: 0.6
      }
    };

    this.insightTypes = new Set([
      'correlation',
      'distribution',
      'outlier',
      'trend',
      'categorical',
      'timeSeries',
      'cluster'
    ]);
  }

  async generateInsights(data, columns, patterns) {
    try {
      const insights = [];

      // Generate all types of insights
      const columnInsights = await this.generateColumnInsights(columns);
      const correlationInsights = await this.generateCorrelationInsights(patterns?.correlations || []);
      const distributionInsights = await this.generateDistributionInsights(patterns?.distributions || []);
      const timeSeriesInsights = await this.generateTimeSeriesInsights(patterns?.timeSeries || []);
      const outlierInsights = await this.generateOutlierInsights(patterns?.outliers || []);

      insights.push(
        ...columnInsights,
        ...correlationInsights,
        ...distributionInsights,
        ...timeSeriesInsights,
        ...outlierInsights
      );

      // Score and filter insights
      const scoredInsights = this.scoreInsights(insights);
      const filteredInsights = this.filterInsights(scoredInsights);

      // Group and sort insights
      return this.groupAndSortInsights(filteredInsights);

    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  async generateColumnInsights(columns) {
    const insights = [];

    Object.entries(columns).forEach(([columnName, columnInfo]) => {
      switch (columnInfo.type) {
        case 'numeric':
          insights.push(...this.generateNumericColumnInsights(columnName, columnInfo));
          break;
        case 'categorical':
          insights.push(...this.generateCategoricalColumnInsights(columnName, columnInfo));
          break;
        case 'date':
          insights.push(...this.generateDateColumnInsights(columnName, columnInfo));
          break;
      }
    });

    return insights;
  }

  generateDistributionInsights(distributions) {
    if (!distributions?.length) return [];

    return distributions.map(dist => ({
      type: 'distribution',
      column: dist.column,
      description: `Distribution analysis for ${dist.column}`,
      importance: this.settings.importanceWeights.distribution,
      details: {
        type: dist.type,
        stats: dist.stats,
        insights: dist.insights
      }
    }));
  }

  generateNumericColumnInsights(columnName, columnInfo) {
    const insights = [];
    const stats = columnInfo.stats || {};

    insights.push({
      type: 'numeric',
      column: columnName,
      description: `Numeric analysis of ${columnName}`,
      importance: 0.7,
      details: {
        mean: stats.mean,
        median: stats.median,
        stdDev: stats.stdDev
      }
    });

    return insights;
  }

  generateCategoricalColumnInsights(columnName, columnInfo) {
    const insights = [];
    const stats = columnInfo.stats || {};

    insights.push({
      type: 'categorical',
      column: columnName,
      description: `Category analysis of ${columnName}`,
      importance: 0.6,
      details: {
        uniqueValues: stats.distinct,
        mostCommon: stats.mode
      }
    });

    return insights;
  }

  generateDateColumnInsights(columnName, columnInfo) {
    const insights = [];
    const stats = columnInfo.stats || {};

    insights.push({
      type: 'date',
      column: columnName,
      description: `Time analysis of ${columnName}`,
      importance: 0.65,
      details: {
        range: stats.range,
        distribution: stats.distribution
      }
    });

    return insights;
  }

  generateCorrelationInsights(correlations) {
    if (!correlations?.length) return [];

    return correlations
      .filter(correlation => Math.abs(correlation.coefficient) >= 0.5)
      .map(correlation => ({
        type: 'correlation',
        columns: correlation.columns,
        description: `${correlation.strength} correlation between ${correlation.columns.join(' and ')}`,
        importance: Math.abs(correlation.coefficient),
        details: correlation
      }));
  }

  generateTimeSeriesInsights(patterns) {
    if (!patterns?.length) return [];

    return patterns.map(pattern => ({
      type: 'timeSeries',
      columns: [pattern.dateColumn, pattern.valueColumn],
      description: `Time series pattern in ${pattern.valueColumn}`,
      importance: pattern.confidence,
      details: pattern
    }));
  }

  generateOutlierInsights(outliers) {
    if (!outliers?.length) return [];

    return outliers.map(outlier => ({
      type: 'outlier',
      column: outlier.column,
      description: `Found ${outlier.metadata.outlierCount} outliers in ${outlier.column}`,
      importance: 0.75,
      details: outlier
    }));
  }

  scoreInsights(insights) {
    return insights.map(insight => ({
      ...insight,
      score: this.calculateInsightScore(insight)
    }));
  }

  calculateInsightScore(insight) {
    const baseScore = insight.importance || 0.5;
    const typeWeight = this.settings.importanceWeights[insight.type] || 0.5;
    return baseScore * typeWeight;
  }

  filterInsights(insights) {
    return insights
      .filter(insight => insight.score >= this.settings.minConfidenceThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.settings.maxTotalInsights);
  }

  groupAndSortInsights(insights) {
    const grouped = new Map();

    // Group by type
    insights.forEach(insight => {
      const current = grouped.get(insight.type) || [];
      grouped.set(insight.type, [...current, insight]);
    });

    // Limit per type and combine
    let result = [];
    grouped.forEach((typeInsights, type) => {
      result = result.concat(
        typeInsights
          .sort((a, b) => b.score - a.score)
          .slice(0, this.settings.maxInsightsPerType)
      );
    });

    return result.sort((a, b) => b.score - a.score);
  }
}

export const insightGenerator = new InsightGenerator();
export default insightGenerator;