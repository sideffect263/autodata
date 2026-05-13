// src/services/brain/rules/numerical3DRules.js

export const numericalRules3D = [
  {
    type: 'scatter',  // Changed from '3d-scatter' to match ControlPanel
    score: 0.9,
    title: '3D Scatter Plot',
    description: 'Explore relationships between three numeric variables',
    conditions: (columns) => {
      if (!Array.isArray(columns) || columns.length < 3) return false;
      return columns.every(col => 
        col.type === 'numeric' && 
        col.stats?.distinct > 10
      );
    },
    dimensions: 3,
    generate: (columns, data) => ({
      type: 'scatter',
      visualization: {
        type: 'scatter',
        dimensions: 3,
        config: {
          x: columns[0].name,
          y: columns[1].name,
          z: columns[2].name,
          colorBy: null,
          sizeBy: null,
          pointSize: 0.5,
          opacity: 1
        }
      },
      columns: {
        x: columns[0].name,
        y: columns[1].name,
        z: columns[2].name
      }
    })
  },
  {
    type: 'bar',  // Changed from '3d-bar' to match ControlPanel
    score: 0.8,
    title: '3D Bar Chart',
    description: 'Compare numeric variables across multiple dimensions',
    conditions: (columns) => {
      if (!Array.isArray(columns) || columns.length < 3) return false;
      return columns.every(col => col.type === 'numeric');
    },
    dimensions: 3,
    generate: (columns, data) => ({
      type: 'bar',
      visualization: {
        type: 'bar',
        dimensions: 3,
        config: {
          x: columns[0].name,
          y: columns[1].name,
          z: columns[2].name,
          height: columns[1].name,
          spacing: 0.2,
          normalizeHeight: true
        }
      },
      columns: {
        x: columns[0].name,
        y: columns[1].name,
        z: columns[2].name
      }
    })
  },
  {
    type: 'surface',  // Changed from '3d-surface' to match ControlPanel
    score: 0.8,
    title: '3D Surface Plot',
    description: 'Visualize how two numeric variables relate to a third',
    conditions: (columns) => {
      if (!Array.isArray(columns) || columns.length !== 3) return false;
      return columns.every(col => col.type === 'numeric');
    },
    dimensions: 3,
    generate: (columns, data) => ({
      type: 'surface',
      visualization: {
        type: 'surface',
        dimensions: 3,
        config: {
          x: columns[0].name,
          y: columns[1].name,
          z: columns[2].name,
          resolution: 50,
          wireframe: false,
          colorScheme: 'default'
        }
      },
      columns: {
        x: columns[0].name,
        y: columns[1].name,
        z: columns[2].name
      }
    })
  }
];

// Add helper functions for type validation
export const isValidVisualizationType = (type) => {
  return ['scatter', 'bar', 'surface'].includes(type);
};

// Add configuration validation
export const validateVisualizationConfig = (config, type) => {
  if (!config || !type) return false;

  const requiredFields = {
    scatter: ['x', 'y', 'z'],
    bar: ['x', 'y', 'z'],
    surface: ['x', 'y', 'z']
  };

  return requiredFields[type]?.every(field => 
    config.hasOwnProperty(field) && 
    typeof config[field] === 'string'
  ) || false;
};

// Add helper for getting default configuration
export const getDefaultConfig = (type) => {
  const defaults = {
    scatter: {
      pointSize: 0.5,
      opacity: 1,
      colorBy: null,
      sizeBy: null
    },
    bar: {
      spacing: 0.2,
      normalizeHeight: true,
      height: null
    },
    surface: {
      resolution: 50,
      wireframe: false,
      colorScheme: 'default'
    }
  };

  return defaults[type] || {};
};

// Export constants for visualization types
export const VISUALIZATION_TYPES = {
  SCATTER: 'scatter',
  BAR: 'bar',
  SURFACE: 'surface'
};

export default {
  rules: numericalRules3D,
  isValidVisualizationType,
  validateVisualizationConfig,
  getDefaultConfig,
  VISUALIZATION_TYPES
};