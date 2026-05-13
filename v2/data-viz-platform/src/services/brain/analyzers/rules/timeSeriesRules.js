// src/services/brain/rules/timeSeriesRules.js

export const timeSeriesRules = [
    {
      type: 'line',
      score: 0.9,
      title: 'Trend Analysis',
      description: 'Track changes over time',
      conditions: (column) => true,
      generate: (column, metadata = {}) => {
        const suggestedMetric = metadata.suggestedMetric || 'value';
        return {
          type: 'line',
          config: {
            x: column.name,
            y: suggestedMetric,
            interpolation: 'monotone',
            showTrend: true
          }
        };
      }
    },
    {
      type: 'area',
      score: 0.8,
      title: 'Cumulative Trend',
      description: 'View cumulative changes over time',
      conditions: (column, metadata = {}) => metadata?.isCumulative ?? false,
      generate: (column, metadata = {}) => {
        const suggestedMetric = metadata.suggestedMetric || 'value';
        return {
          type: 'area',
          config: {
            x: column.name,
            y: suggestedMetric,
            stacked: true
          }
        };
      }
    }
  ];