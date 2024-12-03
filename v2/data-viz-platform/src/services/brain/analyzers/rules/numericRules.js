// src/services/brain/analyzers/rules/numericRules.js

export const numericRules = [
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
          binCount: calculateOptimalBins(column.stats.distinct),
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
    }
  ];
  
  function calculateOptimalBins(distinctCount) {
    return Math.max(10, Math.min(50, Math.ceil(Math.sqrt(distinctCount))));
  }