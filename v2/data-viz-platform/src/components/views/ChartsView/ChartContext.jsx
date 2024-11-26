
// src/components/views/ChartsView/ChartContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
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
  const currentSuggestions = suggestions.filter(
    suggestion => !currentChart || suggestion.visualization.type === currentChart
  );

  const handleChartTypeChange = useCallback((newType) => {
    setCurrentChart(newType);
    setActiveSuggestion(null);
    setSelectedColumns(prev => ({
      ...prev,
      x: '',
      y: '',
      group: ''
    }));
    updatePreferences(new Map([['preferredChartType', newType]]));
  }, [updatePreferences]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setCurrentChart(suggestion.visualization.type);
    setSelectedColumns(prev => ({
      ...prev,
      ...suggestion.visualization.config
    }));
    setActiveSuggestion(suggestion);
    updatePreferences(new Map([
      ['lastUsedSuggestion', suggestion.id],
      ['preferredChartType', suggestion.visualization.type]
    ]));
  }, [updatePreferences]);

  const handleColumnChange = useCallback((newColumns) => {
    setSelectedColumns(newColumns);
    setActiveSuggestion(null);

    const columnInsights = newColumns.x && newColumns.y ? 
      getInsightsForColumn(newColumns.x).concat(getInsightsForColumn(newColumns.y)) :
      [];

    if (columnInsights.length > 0) {
      updatePreferences(new Map([
        ['selectedColumns', [newColumns.x, newColumns.y]],
        ['columnInsights', columnInsights]
      ]));
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
