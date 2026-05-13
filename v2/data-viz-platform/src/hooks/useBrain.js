// src/hooks/useBrain.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { brainService } from '../services/brain/BrainService';
import { visualizationSuggester } from '../services/brain/analyzers/visualizationSuggester';

export const useBrain = (data, options = {}) => {
  // Core states
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferences, setPreferences] = useState(new Map());

  // Visualization specific states
  const [dimensionality, setDimensionality] = useState(options.dimensionality || '2d');
  const [visualizationConfig, setVisualizationConfig] = useState({
    type: options.initialType || 'bar',
    columns: { x: '', y: '', z: '', color: '', size: '', group: '' },
    settings: {
      // 2D settings
      stacked: false,
      smooth: false,
      showTrendline: false,
      // 3D settings
      pointSize: 0.5,
      colorScheme: 'default',
      wireframe: false,
      opacity: 1,
      camera: {
        position: [15, 15, 15],
        fov: 100,
        near: 0.1,
        far: 1000,
      },
      controls: {
        autoRotate: false,
        enableDamping: true,
        dampingFactor: 0.05,
      }
    }
  });

  // Refs for state management
  const dataRef = useRef(data);
  const analysisTimeoutRef = useRef(null);
  const processingQueueRef = useRef([]);
  const isInitializedRef = useRef(false);

  // Data validation
  const validateData = useCallback((dataToValidate) => {
    if (!dataToValidate || !Array.isArray(dataToValidate) || dataToValidate.length === 0) {
      return false;
    }

    // Additional validation for 3D data
    if (dimensionality === '3d') {
      const firstRow = dataToValidate[0];
      const hasNumericColumns = Object.values(firstRow).some(value => {
        const numericValue = parseFloat(value);
        return !isNaN(numericValue);
      });

      if (!hasNumericColumns) {
        setError('3D visualizations require numeric data');
        return false;
      }
    }

    return true;
  }, [dimensionality]);

  // Process data changes
  useEffect(() => {
    if (!validateData(data)) {
      return;
    }

    dataRef.current = data;
    analyzeData();
  }, [data, validateData]);

  // Main analysis function
  const analyzeData = useCallback(async () => {
    if (isProcessing || !validateData(dataRef.current)) {
      return;
    }

    try {
      setIsProcessing(true);
      setIsLoading(true);
      setError(null);

      // Process data through brain service
      const result = await brainService.processData(dataRef.current, {
        ...options,
        dimensionality,
        preferences,
      });

      if (!result) {
        throw new Error('Brain service returned no results');
      }

      // Get visualization suggestions
      const visualizationResult = await visualizationSuggester.generateSuggestions(
        dataRef.current,
        result.columns,
        result.patterns,
        {
          preferences,
          dimensionality,
        }
      );

      // Update states
      setAnalysis(result);
      setSuggestions(visualizationResult || []);
      setInsights(result?.insights || []);

      // Update visualization config if we have suggestions
      if (visualizationResult?.length > 0) {
        const bestSuggestion = visualizationResult[0];
        setVisualizationConfig(prev => ({
          ...prev,
          ...bestSuggestion.visualization
        }));
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error.message || 'Analysis failed');
      setSuggestions([]);
      setInsights([]);
      setAnalysis(null);
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  }, [isProcessing, options, preferences, validateData, dimensionality]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    if (!newPreferences || !(newPreferences instanceof Map)) {
      console.warn('Invalid preferences provided');
      return;
    }

    try {
      const updatedPreferences = new Map([...preferences, ...newPreferences]);
      setPreferences(updatedPreferences);

      if (dataRef.current && analysis) {
        const visualizationResult = await visualizationSuggester.generateSuggestions(
          dataRef.current,
          analysis.columns,
          analysis.patterns,
          {
            preferences: updatedPreferences,
            dimensionality
          }
        );

        if (visualizationResult) {
          setSuggestions(visualizationResult);
        }
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError('Failed to update preferences');
    }
  }, [analysis, preferences, dimensionality]);

  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      processingQueueRef.current = [];
    };
  }, []);

  return {
    // Analysis results
    analysis,
    suggestions,
    insights,
    
    // Visualization state
    visualizationConfig,
    dimensionality,
    
    // Status indicators
    isLoading,
    isProcessing,
    error,
    isInitialized: isInitializedRef.current,
    
    // User preferences
    preferences,
    
    // Actions
    updatePreferences,
    setDimensionality,
    
    // Utility functions
    validateData,
    
    // Metadata
    metadata: analysis?.metadata || null,
    
    // Helper properties
    hasData: validateData(dataRef.current),
    hasAnalysis: !!analysis,
    hasSuggestions: suggestions.length > 0,
    hasInsights: insights.length > 0,
    
    // Direct setters (use with caution)
    setError
  };
};

export default useBrain;