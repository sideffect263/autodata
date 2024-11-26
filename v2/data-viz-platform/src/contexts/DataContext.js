// src/contexts/DataContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { brainService } from '../services/brain/BrainService';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // Core data states
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [currentView, setCurrentView] = useState('upload');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({
    isProcessing: false,
    progress: 0,
    stage: null
  });

  // Process data method
  const processData = useCallback(async (rawData) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      setError('Invalid data format');
      return { success: false, error: 'Invalid data format' };
    }

    try {
      setIsLoading(true);
      setError(null);
      setProcessingStatus({
        isProcessing: true,
        progress: 0,
        stage: 'initializing'
      });

      // Update progress
      setProcessingStatus(prev => ({
        ...prev,
        progress: 20,
        stage: 'validating'
      }));

      // Process data through brain service
      const analysisResult = await brainService.processData(rawData, {
        onProgress: (progress, stage) => {
          setProcessingStatus(prev => ({
            ...prev,
            progress: 20 + (progress * 0.6),
            stage
          }));
        }
      });

      // Important: Update all states at once to trigger single re-render
      setData(rawData);
      setAnalysis(analysisResult);
      setCurrentView('2d'); // Auto-navigate to 2D view
      setProcessingStatus({
        isProcessing: false,
        progress: 100,
        stage: 'completed'
      });

      return { success: true, data: rawData, analysis: analysisResult };
    } catch (err) {
      setError(err.message || 'Error processing data');
      setProcessingStatus({
        isProcessing: false,
        progress: 0,
        stage: 'error'
      });
      return { success: false, error: err.message };
    } finally {
      // Important: Always reset loading state
      setIsLoading(false);
    }
  }, []);

  // Clear all states
  const clearData = useCallback(() => {
    setData(null);
    setAnalysis(null);
    setError(null);
    setProcessingStatus({
      isProcessing: false,
      progress: 0,
      stage: null
    });
    setIsLoading(false);
    setCurrentView('upload');
  }, []);

  const value = {
    // State
    data,
    analysis,
    currentView,
    isLoading,
    error,
    processingStatus,

    // Methods
    processData,
    clearData,
    setCurrentView,
    setData,
    setAnalysis,
    setError,

    // Helper method to check if data is ready
    isDataReady: Boolean(data && analysis && !isLoading)
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};