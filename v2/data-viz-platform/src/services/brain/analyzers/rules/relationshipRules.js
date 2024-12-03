// src/services/brain/rules/relationshipRules.js

export const relationshipRules = [
  {
    type: 'scatter',
    score: 0.85,
    title: 'Correlation Analysis',
    description: 'Explore relationships between variables',
    conditions: (columns) => 
      columns && 
      columns.length === 2,
    generate: (columns, data) => ({
      type: 'scatter',
      config: {
        x: columns[0],
        y: columns[1],
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
      columns && 
      columns.length > 2,
    generate: (columns) => ({
      type: 'heatmap',
      config: {
        dimensions: columns,
        showValues: true,
        colorScale: 'diverging'
      }
    })
  },
  {
    type: 'bubble',
    score: 0.75,
    title: 'Multi-Dimension Analysis',
    description: 'Compare three numeric variables',
    conditions: (columns) => 
      columns && 
      columns.length >= 3,
    generate: (columns) => ({
      type: 'bubble',
      config: {
        x: columns[0],
        y: columns[1],
        size: columns[2],
        showLabels: true,
        animated: true
      }
    })
  }
];