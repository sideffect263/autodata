// src/components/views/ThreeDView/utils.js
export const defaultSettings = {
    camera: {
      position: [15, 15, 15],
      fov: 75,
      near: 0.1,
      far: 1000,
    },
    controls: {
      autoRotate: false,
      rotateSpeed: 1,
      enableDamping: true,
      dampingFactor: 0.05,
      enableZoom: true,
      zoomSpeed: 1,
    },
    display: {
      showGrid: true,
      showAxes: true,
      pointSize: 0.5,
      wireframe: false,
      backgroundColor: '#f8f9fa',
      enableShadows: true,
      antialias: true,
      opacity: 1,
    },
    performance: {
      pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
    },
  };
  
  export const styles = {
    formControl: {
      mt: 2,
      mb: 2,
      '& .MuiInputLabel-root': {
        backgroundColor: 'background.paper',
        px: 0.5,
        ml: -0.5
      }
    },
    suggestionCard: {
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 2
      }
    }
  };
  
  export const generateSuggestions = (data, columnAnalysis) => {
    if (!data || !columnAnalysis) return [];
  
    const suggestions = [];
    const numericColumns = Object.entries(columnAnalysis)
      .filter(([_, analysis]) => analysis.isNumeric)
      .map(([column]) => column);
  
    if (numericColumns.length < 3) return [];
  
    // Calculate column variability for better suggestions
    const getColumnVariability = (column) => {
      const values = data.map(row => row[column]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      return Math.sqrt(variance) / mean;
    };
  
    const columnVariability = numericColumns
      .map(column => ({
        column,
        variability: getColumnVariability(column)
      }))
      .sort((a, b) => b.variability - a.variability);
  
    // Add suggestions
    suggestions.push({
      type: 'scatter',
      title: '3D Distribution Analysis',
      description: `Explore relationships between your most variable metrics`,
      columns: {
        x: columnVariability[0].column,
        y: columnVariability[1].column,
        z: columnVariability[2].column
      }
    });
  
    if (columnVariability.length >= 3) {
      suggestions.push({
        type: 'surface',
        title: 'Surface Trend Analysis',
        description: `Visualize how ${columnVariability[2].column} varies with others`,
        columns: {
          x: columnVariability[0].column,
          y: columnVariability[1].column,
          z: columnVariability[2].column
        }
      });
  
      suggestions.push({
        type: 'bar',
        title: '3D Comparative Analysis',
        description: `Compare metrics across multiple dimensions`,
        columns: {
          x: columnVariability[0].column,
          y: columnVariability[1].column,
          z: columnVariability[2].column
        }
      });
    }
  
    return suggestions;
  };