// src/services/brain/rules/categoricalRules.js

export const categoricalRules = [
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
  ];