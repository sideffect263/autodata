// src/contexts/DataContext.jsx
import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useRef,
  useEffect 
} from 'react';
import { brainService } from '../services/brain/BrainService';

// Define types for TypeScript support if needed
const initialProcessingStatus = {
  isProcessing: false,
  progress: 0,
  stage: null,
  error: null
};

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // Refs for cleanup and memory management
  const processingTimeoutRef = useRef(null);
  const cleanupRef = useRef(false);
  
  // Core data states
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [currentView, setCurrentView] = useState('upload');
  
  // UI states with more detailed status tracking
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(initialProcessingStatus);

  // Data validation
  const validateData = useCallback((rawData) => {
    if (!rawData) return { valid: false, error: 'No data provided' };
    if (!Array.isArray(rawData)) return { valid: false, error: 'Data must be an array' };
    if (rawData.length === 0) return { valid: false, error: 'Data array is empty' };
    if (!rawData[0] || typeof rawData[0] !== 'object') {
      return { valid: false, error: 'Invalid data format' };
    }
    return { valid: true };
  }, []);

  // Enhanced process data method with better error handling and cleanup
  const processData = useCallback(async (rawData) => {
    const validation = validateData(rawData);
    if (!validation.valid) {
      setError(validation.error);
      return { success: false, error: validation.error };
    }

    // Clear any existing timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    try {
      setIsLoading(true);
      setError(null);
      setProcessingStatus({
        isProcessing: true,
        progress: 0,
        stage: 'initializing',
        error: null
      });

      // Process data with progress tracking and automatic timeout
      const analysisPromise = brainService.processData(rawData, {
        onProgress: (progress, stage) => {
          if (cleanupRef.current) return; // Prevent updates if component unmounted
          
          setProcessingStatus(prev => ({
            ...prev,
            progress: Math.min(20 + (progress * 0.6), 95), // Never reach 100 until complete
            stage
          }));
        }
      });

      // Set processing timeout
      const timeoutPromise = new Promise((_, reject) => {
        processingTimeoutRef.current = setTimeout(() => {
          reject(new Error('Processing timeout - operation took too long'));
        }, 30000); // 30 second timeout
      });

      // Race between processing and timeout
      const analysisResult = await Promise.race([analysisPromise, timeoutPromise]);

      if (!analysisResult) {
        throw new Error('Failed to process data: No analysis result returned');
      }

      // Batch state updates
      await Promise.all([
        setData(rawData),
        setAnalysis(analysisResult),
        setProcessingStatus({
          isProcessing: false,
          progress: 100,
          stage: 'completed',
          error: null
        }),
        setCurrentView('d2')
      ]);

      return { 
        success: true, 
        data: rawData, 
        analysis: analysisResult 
      };

    } catch (err) {
      const errorMessage = err.message || 'Error processing data';
      console.error('Data processing failed:', err);
      
      // Update all error states together
      setError(errorMessage);
      setProcessingStatus({
        isProcessing: false,
        progress: 0,
        stage: 'error',
        error: errorMessage
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };

    } finally {
      setIsLoading(false);
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    }
  }, [validateData]);

  // Enhanced clear method with proper cleanup
  const clearData = useCallback(() => {
    // Clear timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    // Reset all states
    setData(null);
    setAnalysis(null);
    setError(null);
    setProcessingStatus(initialProcessingStatus);
    setIsLoading(false);
    setCurrentView('upload');
  }, []);

  // Enhanced view change handler with validation
  const handleViewChange = useCallback((newView) => {
    if (!data && newView !== 'upload') {
      console.warn('Attempted to navigate without data');
      return;
    }
    
    if (processingStatus.isProcessing && newView !== currentView) {
      console.warn('View change attempted during processing');
      return;
    }
    
    setCurrentView(newView);
  }, [data, processingStatus.isProcessing, currentView]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanupRef.current = true;
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Computed properties
  const computedValue = {
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

    // Helper methods with memoization
    isDataReady: Boolean(data && analysis && !isLoading),
    hasData: Boolean(data),
    hasAnalysis: Boolean(analysis),
    isProcessing: processingStatus.isProcessing,

    // Additional helper methods
    dataSize: data?.length || 0,
    columnCount: data?.[0] ? Object.keys(data[0]).length : 0,
    lastProcessed: analysis?.timestamp || null,
  };

  return (
    <DataContext.Provider value={computedValue}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;