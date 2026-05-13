// src/hooks/useAnalysis.js

import { useState, useEffect } from 'react';
import { analysisService } from '../services/analysis/AnalysisService';

export const useAnalysis = (data) => {
  const [analysisState, setAnalysisState] = useState({
    insights: [],
    suggestions: [],
    analysisComplete: false
  });

  useEffect(() => {
    if (data) {
      // Initialize analysis with new data
      analysisService.initializeData(data);

      // Subscribe to analysis updates
      const unsubscribe = analysisService.subscribe(setAnalysisState);
      return unsubscribe;
    }
  }, [data]);

  return analysisState;
};

export default useAnalysis;