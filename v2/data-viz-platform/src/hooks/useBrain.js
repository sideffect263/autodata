// src/hooks/useBrain.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { brainService } from '../services/brain/BrainService';
import { visualizationSuggester } from '../services/brain/analyzers/visualizationSuggester';

export const useBrain = (data, options = {}) => {
  // State management
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferences, setPreferences] = useState(new Map());

  // Refs for tracking state between renders and async operations
  const dataRef = useRef(data);
  const analysisTimeoutRef = useRef(null);
  const processingQueueRef = useRef([]);

  // Initialize brain service
  useEffect(() => {
    const initBrain = async () => {
      try {
        await brainService.initialize();
      } catch (error) {
        console.error('Brain initialization failed:', error);
        setError('Failed to initialize analysis system');
      }
    };

    initBrain();

    // Cleanup function
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  // Process data changes
  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    dataRef.current = data;
    analyzeData();
  }, [data]);

  // Main analysis function
  const analyzeData = useCallback(async () => {
    if (isProcessing) {
      // Queue analysis for later if currently processing
      processingQueueRef.current.push(dataRef.current);
      return;
    }

    try {
      setIsProcessing(true);
      setIsLoading(true);
      setError(null);

      const result = await brainService.processData(dataRef.current, {
        ...options,
        preferences: preferences
      });

      // Update state with analysis results
      setAnalysis(result);
      setSuggestions(result.suggestions);
      setInsights(result.insights);

      // Process next item in queue if any
      if (processingQueueRef.current.length > 0) {
        const nextData = processingQueueRef.current.shift();
        analysisTimeoutRef.current = setTimeout(() => {
          dataRef.current = nextData;
          analyzeData();
        }, 100);
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error.message || 'Analysis failed');
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  }, [isProcessing, options]);

  // Update user preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      setPreferences(new Map([...preferences, ...newPreferences]));
      
      // Update brain service preferences
      await brainService.updatePreferences(newPreferences);

      // Regenerate suggestions if we have current analysis
      if (analysis && !isProcessing) {
        // Use visualizationSuggester instead of brainService directly
        const updatedSuggestions = await visualizationSuggester.generateSuggestions(
          dataRef.current,
          analysis.columns,
          analysis.patterns,
          new Map([...preferences, ...newPreferences])
        );
        setSuggestions(updatedSuggestions);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError('Failed to update preferences');
    }
  }, [analysis, isProcessing, preferences]);

  // Get specific insights
  const getInsightsForColumn = useCallback((columnName) => {
    if (!analysis || !analysis.insights) return [];
    return analysis.insights.filter(insight => 
      insight.columns.includes(columnName)
    );
  }, [analysis]);

  // Get visualization suggestions for specific types
  const getSuggestionsForType = useCallback((type) => {
    if (!suggestions) return [];
    return suggestions.filter(suggestion => 
      suggestion.visualization.type === type
    );
  }, [suggestions]);

  // Reset analysis state
  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setSuggestions([]);
    setInsights([]);
    setError(null);
    processingQueueRef.current = [];
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
  }, []);

  // Export data and analysis
  const exportAnalysis = useCallback(() => {
    if (!analysis) return null;
    
    return {
      timestamp: new Date().toISOString(),
      data: dataRef.current,
      analysis: analysis,
      suggestions: suggestions,
      insights: insights
    };
  }, [analysis, suggestions, insights]);

  // Save current state
  const saveState = useCallback(async () => {
    try {
      await brainService.saveState();
      return true;
    } catch (error) {
      console.error('Failed to save state:', error);
      return false;
    }
  }, []);

  return {
    // Analysis results
    analysis,
    suggestions,
    insights,
    
    // Status indicators
    isLoading,
    isProcessing,
    error,
    
    // User preferences
    preferences,
    updatePreferences,
    
    // Utility functions
    getInsightsForColumn,
    getSuggestionsForType,
    resetAnalysis,
    exportAnalysis,
    saveState,

    // Analysis metadata
    metadata: analysis?.metadata || null,
    
    // Helper properties
    hasData: !!data && data.length > 0,
    hasAnalysis: !!analysis,
    hasSuggestions: suggestions.length > 0,
    hasInsights: insights.length > 0
  };
};

export default useBrain;