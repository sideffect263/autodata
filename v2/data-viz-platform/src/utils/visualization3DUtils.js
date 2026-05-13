// src/utils/visualization3DUtils.js
import { Color, Vector3, Box3 } from 'three';
import chroma from 'chroma-js';

/**
 * Data Normalization and Processing
 */
export const processDataForVisualization = {
  /**
   * Normalize a single array of values to a target range
   */
  normalize: (values, targetMin = -5, targetMax = 5) => {
    if (!values || values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    return values.map(value => 
      range === 0 ? targetMin : ((value - min) / range) * (targetMax - targetMin) + targetMin
    );
  },

  /**
   * Process data for 3D scatter plot
   */
  scatterPlot: (data, columns, options = {}) => {
    const { 
      x: xColumn, 
      y: yColumn, 
      z: zColumn, 
      color: colorColumn 
    } = columns;
    
    if (!data || !xColumn || !yColumn || !zColumn) return [];

    const xValues = data.map(d => d[xColumn]);
    const yValues = data.map(d => d[yColumn]);
    const zValues = data.map(d => d[zColumn]);

    const normalizedX = processDataForVisualization.normalize(xValues);
    const normalizedY = processDataForVisualization.normalize(yValues);
    const normalizedZ = processDataForVisualization.normalize(zValues);

    return data.map((point, index) => ({
      id: index,
      position: [normalizedX[index], normalizedY[index], normalizedZ[index]],
      originalValues: {
        x: point[xColumn],
        y: point[yColumn],
        z: point[zColumn],
        color: colorColumn ? point[colorColumn] : null
      },
      color: colorColumn ? point[colorColumn] : null
    }));
  },

  /**
   * Process data for 3D bar chart
   */
  barChart: (data, columns, options = {}) => {
    const { x: xColumn, y: yColumn, z: zColumn } = columns;
    const { spacing = 0.2, normalizeHeight = true } = options;

    if (!data || !xColumn || !yColumn || !zColumn) return [];

    const xValues = data.map(d => d[xColumn]);
    const yValues = data.map(d => d[yColumn]);
    const zValues = data.map(d => d[zColumn]);

    const normalizedX = processDataForVisualization.normalize(xValues);
    const normalizedY = normalizeHeight ? processDataForVisualization.normalize(yValues) : yValues;
    const normalizedZ = processDataForVisualization.normalize(zValues);

    return data.map((point, index) => ({
      position: [normalizedX[index], normalizedY[index] / 2, normalizedZ[index]],
      height: normalizedY[index],
      originalValues: {
        x: point[xColumn],
        y: point[yColumn],
        z: point[zColumn]
      }
    }));
  },

  /**
   * Process data for surface plot
   */
  surfacePlot: (data, columns, options = {}) => {
    const { x: xColumn, y: yColumn, z: zColumn } = columns;
    const { resolution = 50 } = options;

    if (!data || !xColumn || !yColumn || !zColumn) return null;

    // Get unique x and y values
    const xValues = [...new Set(data.map(d => d[xColumn]))].sort((a, b) => a - b);
    const yValues = [...new Set(data.map(d => d[yColumn]))].sort((a, b) => a - b);

    // Create grid
    const grid = Array(yValues.length).fill().map(() => Array(xValues.length).fill(null));
    const zValues = [];

    // Fill grid with z values
    data.forEach(point => {
      const xIndex = xValues.indexOf(point[xColumn]);
      const yIndex = yValues.indexOf(point[yColumn]);
      if (xIndex !== -1 && yIndex !== -1) {
        grid[yIndex][xIndex] = point[zColumn];
        zValues.push(point[zColumn]);
      }
    });

    return {
      grid,
      dimensions: {
        x: xValues,
        y: yValues,
        z: {
          min: Math.min(...zValues),
          max: Math.max(...zValues)
        }
      }
    };
  }
};

/**
 * Color Management
 */
export const colorManagement = {
  schemes: {
    sequential: [
      'blues',
      'reds',
      'greens',
      'purples',
      'oranges',
      'greys'
    ],
    diverging: [
      ['#2166ac', '#f7f7f7', '#b2182b'],
      ['#1a9850', '#f7f7f7', '#d73027'],
      ['#7b3294', '#f7f7f7', '#008837']
    ],
    categorical: [
      '#1f77b4',
      '#ff7f0e',
      '#2ca02c',
      '#d62728',
      '#9467bd',
      '#8c564b',
      '#e377c2',
      '#7f7f7f',
      '#bcbd22',
      '#17becf'
    ]
  },

  getColorScale: (type, domain = [0, 1]) => {
    switch (type) {
      case 'sequential':
        return chroma.scale(['#f7fbff', '#08519c']).domain(domain);
      case 'diverging':
        return chroma.scale(['#2166ac', '#f7f7f7', '#b2182b']).domain([domain[0], (domain[1] - domain[0]) / 2, domain[1]]);
      case 'categorical':
        return (value) => colorManagement.schemes.categorical[value % colorManagement.schemes.categorical.length];
      default:
        return chroma.scale(['#f7fbff', '#08519c']).domain(domain);
    }
  },

  interpolateColors: (value, colorScale) => {
    return new Color(colorScale(value).hex());
  }
};

/**
 * Camera and Scene Management
 */
export const sceneManagement = {
  /**
   * Calculate optimal camera position based on data bounds
   */
  calculateCameraPosition: (data, padding = 1.5) => {
    if (!data || data.length === 0) return new Vector3(15, 15, 15);

    const box = new Box3();
    data.forEach(point => {
      box.expandByPoint(new Vector3(...point.position));
    });

    const center = new Vector3();
    box.getCenter(center);
    const size = new Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * padding;

    return new Vector3(distance, distance, distance);
  },

  /**
   * Calculate optimal field of view
   */
  calculateFOV: (data, aspect) => {
    // Default FOV if no data
    if (!data || data.length === 0) return 75;

    const box = new Box3();
    data.forEach(point => {
      box.expandByPoint(new Vector3(...point.position));
    });

    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    // Adjust FOV based on data size and aspect ratio
    return Math.min(75, 2 * Math.atan((maxDim / (2 * aspect)) / 15) * (180 / Math.PI));
  }
};

/**
 * Animation and Interaction Utilities
 */
export const animationUtils = {
  /**
   * Create smooth transitions for camera movements
   */
  createCameraTransition: (startPos, endPos, duration = 1000) => {
    const start = new Vector3().copy(startPos);
    const end = new Vector3().copy(endPos);
    const delta = new Vector3().subVectors(end, start);

    return (t) => {
      const progress = Math.min(1, t / duration);
      // Ease in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      return new Vector3().copy(start).addScaledVector(delta, eased);
    };
  },

  /**
   * Generate hover effects
   */
  createHoverEffect: (originalScale = 1) => {
    return {
      onHover: (scale = 1.2) => originalScale * scale,
      onUnhover: () => originalScale
    };
  }
};

/**
 * Performance Optimization Utilities
 */
export const performanceUtils = {
  /**
   * Calculate optimal level of detail based on point count
   */
  calculateLOD: (pointCount) => {
    if (pointCount < 1000) return { segments: 32, wireframe: false };
    if (pointCount < 10000) return { segments: 16, wireframe: false };
    return { segments: 8, wireframe: true };
  },

  /**
   * Determine if instancing should be used
   */
  shouldUseInstancing: (pointCount) => pointCount > 1000,

  /**
   * Chunk large datasets for progressive loading
   */
  chunkData: (data, chunkSize = 1000) => {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
  }
};

const visualization3DUtils = {
  processDataForVisualization,
  colorManagement,
  sceneManagement,
  animationUtils,
  performanceUtils
};

export default visualization3DUtils;