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
// In processData function within DataContext
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

    const analysisResult = await brainService.processData(rawData, {
      onProgress: (progress, stage) => {
        setProcessingStatus(prev => ({
          ...prev,
          progress: 20 + (progress * 0.6),
          stage
        }));
      }
    });

    if (!analysisResult) {
      throw new Error('Failed to process data: No analysis result returned');
    }

    // Use Promise.all to ensure all state updates happen together
    await Promise.all([
      setData(rawData),
      setAnalysis(analysisResult),
      setProcessingStatus({
        isProcessing: false,
        progress: 100,
        stage: 'completed'
      }),
      console.log('Set current view to 2D'),
      setCurrentView('d2') // Force navigation to 2D view
    ]);

    return { success: true, data: rawData, analysis: analysisResult };
  } catch (err) {
    console.error('Data processing failed:', err);
    setError(err.message || 'Error processing data');
    setProcessingStatus({
      isProcessing: false,
      progress: 0,
      stage: 'error'
    });
    return { success: false, error: err.message };
  } finally {
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

  // Handle view changes
  const handleViewChange = useCallback((newView) => {
    // Only allow navigation to other views if data is loaded
    if (newView !== 'upload' && !data) {
      return;
    }
    setCurrentView(newView);
  }, [data]);

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
    setCurrentView: handleViewChange,
    setData,
    setAnalysis,
    setError,
    clearData,

    // Helper methods
    isDataReady: Boolean(data && analysis && !isLoading),
    hasData: Boolean(data),
    hasAnalysis: Boolean(analysis),
    isProcessing: processingStatus.isProcessing
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;