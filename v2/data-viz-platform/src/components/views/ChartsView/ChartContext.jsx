// src/components/views/ChartsView/ChartContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useBrain } from '../../../hooks/useBrain';

const ChartContext = createContext(null);

export const useChart = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a ChartProvider');
  }
  return context;
};

export const ChartProvider = ({ children }) => {
  const { data } = useData();
  const {
    analysis,
    suggestions,
    insights,
    isLoading: brainLoading,
    error: brainError,
    updatePreferences,
    getInsightsForColumn,
  } = useBrain(data);

  // Chart state
  const [currentChart, setCurrentChart] = useState('bar');
  const [selectedColumns, setSelectedColumns] = useState({
    x: '',
    y: '',
    group: '',
    stacked: false,
    smooth: false,
    showTrendline: false
  });
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [localError, setLocalError] = useState(null);

  // Get filtered suggestions
  const currentSuggestions = suggestions?.filter(
    suggestion => !currentChart || suggestion.visualization?.type === currentChart
  ) || [];

  // Reset selected columns when data changes
  useEffect(() => {
    console.log('Data changed:', data);
    console.log('Selected columns:', Object.keys(data[0]));
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      setSelectedColumns(prev => ({
        ...prev,
        x: columns[0] || '',
        y: columns[1] || '',
        group: ''
      }));
    }
  }, [data]);

  const handleChartTypeChange = useCallback((newType) => {
    if (!newType) return;
    
    setCurrentChart(newType);
    setActiveSuggestion(null);
    
    // Only reset columns if they're not compatible with new chart type
    if (newType === 'pie') {
      setSelectedColumns(prev => ({
        ...prev,
        group: ''
      }));
    }
    
    updatePreferences(new Map([['preferredChartType', newType]]));
  }, [updatePreferences]);
  const handleSuggestionClick = useCallback((suggestion) => {

    console.log('Suggestion clicked:', suggestion);
    if (!suggestion || !suggestion.visualization) return;
  
    const { type, config } = suggestion.visualization;
  
  
    setCurrentChart(type);
  
    // For pie charts, handle count differently
    const newColumns = {
      x: config.x || config.dimension || '', // Add support for dimension property
      y: type === 'pie' ? 'count' : (config.y || config.value || 'count'), // Add support for value property
      group: config.group || '',
      stacked: !!config.stacked,
      smooth: !!config.smooth,
      showTrendline: !!config.showTrendline
    };
  
  
    setSelectedColumns(newColumns);
    setActiveSuggestion(suggestion);
  
    // Update preferences with the correct configuration
    updatePreferences(new Map([
      ['lastUsedSuggestion', suggestion.id],
      ['preferredChartType', type],
      ['selectedColumns', newColumns]
    ]));
  }, [updatePreferences]);
  
  const handleColumnChange = useCallback((newColumns) => {
    if (!newColumns) return;

    setSelectedColumns(newColumns);
    setActiveSuggestion(null);

    // Only update preferences if we have valid columns
    if (newColumns.x && newColumns.y) {
      const columnInsights = getInsightsForColumn(newColumns.x)
        .concat(getInsightsForColumn(newColumns.y));

      if (columnInsights.length > 0) {
        updatePreferences(new Map([
          ['selectedColumns', [newColumns.x, newColumns.y]],
          ['columnInsights', columnInsights]
        ]));
      }
    }
  }, [getInsightsForColumn, updatePreferences]);

  const value = {
    // State
    currentChart,
    selectedColumns,
    activeSuggestion,
    suggestions: currentSuggestions,
    insights,
    analysis,
    error: brainError || localError,
    isLoading: brainLoading,
    availableColumns: data ? Object.keys(data[0] || {}) : [],

    // Actions
    setCurrentChart: handleChartTypeChange,
    setSelectedColumns: handleColumnChange,
    handleSuggestionClick,
    setError: setLocalError,
    clearError: () => setLocalError(null),
  };

  return (
    <ChartContext.Provider value={value}>
      {children}
    </ChartContext.Provider>
  );
};