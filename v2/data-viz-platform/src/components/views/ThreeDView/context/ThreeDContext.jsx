// src/components/views/ThreeDView/context/ThreeDContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useData } from '../../../../contexts/DataContext';
import { useBrain } from '../../../../hooks/useBrain';
import { visualizationSuggester } from '../../../../services/brain/analyzers/visualizationSuggester';

const ThreeDContext = createContext(null);

// Initial state object outside component to prevent recreation
const initialState = {
  columns: {
    x: '',
    y: '',
    z: '',
    color: '',
    size: '',
    group: ''
  },
  settings: {
    camera: {
      position: [15, 15, 15],
      target: [0, 0, 0],
      fov: 100,
      near: 0.1,
      far: 1000,
      zoom: 1
    },
    controls: {
      autoRotate: false,
      rotateSpeed: 1,
      enableDamping: true,
      dampingFactor: 0.05,
      enableZoom: true,
      zoomSpeed: 1,
      enablePan: true,
      panSpeed: 1
    },
    display: {
      showGrid: true,
      showAxes: true,
      pointSize: 0.5,
      wireframe: false,
      colorScheme: 'default',
      backgroundColor: '#f8f9fa',
      enableShadows: true,
      antialias: true,
      opacity: 1,
      axisLabels: true,
      legendPosition: 'right'
    },
    performance: {
      pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
      maxPoints: 10000,
      lodLevels: 3,
      frustumCulling: true
    },
    animation: {
      enabled: true,
      duration: 750,
      easing: 'cubic'
    }
  }
};

export const useThreeD = () => {
  const context = useContext(ThreeDContext);
  if (!context) {
    throw new Error('useThreeD must be used within a ThreeDProvider');
  }
  return context;
};

export const ThreeDProvider = ({ children }) => {
  const { data, analysis } = useData();
  const brain = useBrain(data, { dimensionality: '3d' });



  // Core state with initial values
  const [state, setState] = useState({
    visualizationType: 'scatter',
    columns: initialState.columns,
    settings: initialState.settings,
    activeSuggestion: null,
    error: null,
    isProcessing: false
  });

  // Memoized suggestions
  const suggestions = useMemo(() => {
    if (!brain.suggestions) return [];

    
    return brain.suggestions.filter(suggestion => 
      suggestion.visualization?.dimensions === 3 &&
      suggestion.visualization?.type &&
      suggestion.visualization?.config
    );
  }, [brain.suggestions]);

  // Batch update state helper
  const updateState = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    if (!data || !analysis || state.isProcessing) return;

    try {
      updateState({ isProcessing: true });

      const vis3dSuggestions = await visualizationSuggester.generateSuggestions(
        data,
        analysis.columns,
        analysis.patterns || {},
        { dimensions: 3 }
      );

      if (brain.updatePreferences) {
        
        await brain.updatePreferences(new Map([
          ['3dSuggestions', vis3dSuggestions]
        ]));
      }

      updateState({ error: null });
    } catch (error) {
      console.error('Failed to load 3D suggestions:', error);
      updateState({ error: 'Failed to load suggestions: ' + error.message });
    } finally {
      updateState({ isProcessing: false });
    }
  }, [data, analysis, state.isProcessing, updateState]);

  // Initialize with best suggestion
  useEffect(() => {
    if (suggestions.length > 0 && !state.activeSuggestion && data && !state.columns.x) {
      const bestSuggestion = suggestions[0];
      setState(prevState => ({
        ...prevState,
        activeSuggestion: bestSuggestion,
        visualizationType: bestSuggestion.visualization.type,
        columns: {
          ...prevState.columns,
          ...bestSuggestion.visualization.config
        }
      }));
    }
  }, [suggestions, data]); // Only depend on suggestions and data

  // Validate columns
  const validateColumns = useCallback((cols) => {
    if (!data || !data.length) return false;
    
    const requiredColumns = ['x', 'y', 'z'];
    return requiredColumns.every(col => 
      cols[col] && 
      typeof cols[col] === 'string' &&
      data[0].hasOwnProperty(cols[col])
    );
  }, [data]);

  // Handle visualization type change
 
  const setVisualizationType = useCallback((type) => {
    setState(prevState => {
      if (!type || type === prevState.visualizationType) return prevState;
      return {
        ...prevState,
        visualizationType: type,
        activeSuggestion: null
      };
    });
  
    if (brain.updatePreferences) {
      brain.updatePreferences(new Map([
        ['preferred3DType', type],
        ['lastVisualizationType', type]
      ]));
    }
  }, [brain]);


  // Handle column change
  const handleColumnChange = useCallback((axis, value) => {
    if (!axis || !data) return;

    try {
      const newColumns = {
        ...state.columns,
        [axis]: value
      };

      updateState({
        columns: newColumns,
        activeSuggestion: null
      });

      if (brain.updatePreferences && brain.getInsightsForColumn) {
        const columnInsights = brain.getInsightsForColumn(value);
        brain.updatePreferences(new Map([
          ['selected3DColumns', newColumns],
          ['column3DInsights', columnInsights]
        ]));
      }
    } catch (err) {
      updateState({ error: 'Failed to update column: ' + err.message });
    }
  }, [state.columns, data, brain, updateState]);

  // Handle settings change
  const handleSettingChange = useCallback((category, setting, value) => {
    setState(prevState => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        [category]: {
          ...prevState.settings[category],
          [setting]: value
        }
      }
    }));
  }, []); // Remove dependencies as we're using functional update


  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    if (!suggestion?.visualization) return;

    try {
      const updates = {
        activeSuggestion: suggestion,
        visualizationType: suggestion.visualization.type,
        columns: {
          ...state.columns,
          ...suggestion.visualization.config
        }
      };

      updateState(updates);

      if (brain.updatePreferences) {
        brain.updatePreferences(new Map([
          ['last3DSuggestion', suggestion.id],
          ['preferred3DType', suggestion.visualization.type],
          ['selected3DColumns', suggestion.visualization.config]
        ]));
      }
    } catch (err) {
      updateState({ error: 'Failed to apply suggestion: ' + err.message });
    }
  }, [state.columns, brain, updateState]);

  // Context value
  const value = useMemo(() => ({
    // State
    ...state,
    suggestions,
    isValid: validateColumns(state.columns),
    hasData: !!data?.length,
    hasAnalysis: !!analysis,
    availableColumns: data ? Object.keys(data[0] || {}) : [],
    performanceMetrics: {
      pointCount: data?.length || 0,
      fps: 60,
      memoryUsage: performance?.memory?.usedJSHeapSize || 0
    },

    // Actions
    setVisualizationType,
    handleSuggestionClick,
    handleColumnChange,
    handleSettingChange,
    updateSettings: settings => updateState({ settings }),
    setError: error => updateState({ error }),
    loadSuggestions,

    // Brain integration
    ...brain
  }), [
    state,
    suggestions,
    validateColumns,
    data,
    analysis,
    setVisualizationType,
    handleSuggestionClick,
    handleColumnChange,
    handleSettingChange,
    updateState,
    loadSuggestions,
    brain
  ]);

  return (
    <ThreeDContext.Provider value={value}>
      {children}
    </ThreeDContext.Provider>
  );
};

export default ThreeDProvider;