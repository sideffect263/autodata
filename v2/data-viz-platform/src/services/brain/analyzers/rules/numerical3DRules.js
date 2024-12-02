// src/services/brain/rules/numerical3DRules.js
export const numericalRules3D = [
    {
      type: '3d-scatter',
      score: 0.9,
      title: '3D Scatter Plot',
      description: 'Explore relationships between three numeric variables',
      conditions: (column) => 
        column.type === 'numeric' &&
        column.stats.distinct > 10,
      dimensions: 3,
      generate: (column, data) => ({
        type: '3d-scatter',
        config: {
          x: column.name,
          y: column.name,
          z: column.name,
          colorBy: null,
          sizeBy: null
        }
      })
    },
    {
      type: '3d-bar',
      score: 0.8,
      title: '3D Bar Chart',
      description: 'Compare numeric variables across multiple dimensions',
      conditions: (columns) => 
        columns.every(col => col.type === 'numeric') &&
        columns.length >= 3,
      dimensions: 3,
      generate: (columns, data) => ({
        type: '3d-bar',
        config: {
          x: columns[0].name,
          y: columns[1].name,
          z: columns[2].name
        }
      })
    },
    {
      type: '3d-surface',
      score: 0.8,
      title: '3D Surface Plot',
      description: 'Visualize how two numeric variables relate to a third',
      conditions: (columns) =>
        columns.every(col => col.type === 'numeric') &&
        columns.length === 3,
      dimensions: 3,
      generate: (columns, data) => ({
        type: '3d-surface',
        config: {
          x: columns[0].name,
          y: columns[1].name,
          z: columns[2].name
        }
      })
    }
  ];