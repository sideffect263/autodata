// src/services/brain/analyzers/rules/statisticalRules.js

export const statisticalRules = [
    {
      type: 'histogram',
      score: 0.8,
      title: 'Distribution Analysis',
      description: (pattern) => `Analyze the distribution of ${pattern.columns[0]}`,
      complexity: 1,
      conditions: (pattern) => pattern.type === 'numeric' && pattern.stats.distinct > 10,
      generate: (pattern, data) => ({
        type: 'histogram',
        config: {
          x: pattern.columns[0],
          binCount: Math.min(50, Math.ceil(Math.sqrt(pattern.stats.distinct))),
          showMean: true,
          showMedian: true,
          overlayNormal: true
        }
      })
    },
    {
      type: 'boxplot',
      score: 0.75,
      title: 'Statistical Summary',
      description: (pattern) => `View summary statistics and outliers for ${pattern.columns[0]}`,
      complexity: 1,
      conditions: (pattern) => pattern.type === 'numeric',
      generate: (pattern, data) => ({
        type: 'boxplot',
        config: {
          x: pattern.columns[0],
          showOutliers: true,
          showStats: true,
          orientation: 'vertical'
        }
      })
    },
    {
      type: 'heatmap',
      score: 0.85,
      title: 'Correlation Matrix',
      description: (pattern) => `Analyze correlations between numeric variables`,
      complexity: 2,
      conditions: (pattern) => pattern.type === 'correlation' && pattern.columns.length >= 3,
      generate: (pattern, data) => ({
        type: 'heatmap',
        config: {
          columns: pattern.columns,
          showValues: true,
          colorScale: 'diverging',
          cellSize: 40
        }
      })
    },
    {
      type: 'scatterMatrix',
      score: 0.8,
      title: 'Scatter Plot Matrix',
      description: (pattern) => `Explore relationships between multiple numeric variables`,
      complexity: 2,
      conditions: (pattern) => 
        pattern.type === 'numeric' && 
        pattern.columns.length >= 2 && 
        pattern.columns.length <= 6,
      generate: (pattern, data) => ({
        type: 'scatterMatrix',
        config: {
          columns: pattern.columns,
          showTrendlines: true,
          showHistograms: true,
          size: 150
        }
      })
    },
    {
      type: 'violin',
      score: 0.7,
      title: 'Distribution Comparison',
      description: (pattern) => `Compare distributions across categories`,
      complexity: 2,
      conditions: (pattern) => 
        pattern.type === 'numeric' && 
        pattern.categoricalColumns?.length > 0,
      generate: (pattern, data) => ({
        type: 'violin',
        config: {
          x: pattern.categoricalColumns[0],
          y: pattern.columns[0],
          showBox: true,
          showMean: true,
          bandwidth: 0.5
        }
      })
    }
  ];