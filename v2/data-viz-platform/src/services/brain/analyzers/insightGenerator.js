// src/services/brain/analyzers/insightGenerator.js
export const generateInsights = async (data, columns, patterns) => {
    const insights = [];
  
    // Generate column-based insights
    Object.entries(columns).forEach(([columnName, columnInfo]) => {
      insights.push(...generateColumnInsights(columnName, columnInfo));
    });
  
    // Generate pattern-based insights
    if (patterns.correlations) {
      insights.push(...generateCorrelationInsights(patterns.correlations));
    }
  
    if (patterns.timeSeries) {
      insights.push(...generateTimeSeriesInsights(patterns.timeSeries));
    }
  
    // Sort insights by importance
    return insights.sort((a, b) => b.importance - a.importance);
  };
  
  const generateColumnInsights = (columnName, columnInfo) => {
    const insights = [];
  
    switch (columnInfo.type) {
      case 'numeric':
        insights.push({
          type: 'distribution',
          columns: [columnName],
          description: `Distribution of ${columnName} values`,
          importance: 0.7,
          stats: columnInfo.stats
        });
        break;
  
      case 'categorical':
        insights.push({
          type: 'category',
          columns: [columnName],
          description: `Category distribution for ${columnName}`,
          importance: 0.6,
          uniqueValues: columnInfo.stats.distinct
        });
        break;
    }
  
    return insights;
  };
  
  const generateCorrelationInsights = (correlations) => {
    return correlations.map(correlation => ({
      type: 'correlation',
      columns: correlation.columns,
      description: `${correlation.strength} correlation between ${correlation.columns.join(' and ')}`,
      importance: Math.abs(correlation.coefficient),
      correlation: correlation.coefficient
    }));
  };
  
  const generateTimeSeriesInsights = (timeSeriesPatterns) => {
    return timeSeriesPatterns.map(pattern => ({
      type: 'timeSeries',
      columns: [pattern.dateColumn, pattern.valueColumn],
      description: `Time series pattern in ${pattern.valueColumn}`,
      importance: pattern.confidence,
      pattern
    }));
  };