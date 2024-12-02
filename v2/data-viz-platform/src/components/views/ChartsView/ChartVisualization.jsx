// src/components/views/ChartsView/ChartVisualization.jsx
import React from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { useData } from '../../../contexts/DataContext';
import { useChart } from './ChartContext';
import BarChart from '../../charts/BarChart';
import LineChart from '../../charts/LineChart';
import ScatterPlot from '../../charts/ScatterPlot';
import PieChart from '../../charts/PieChart';
import ChartControls from '../../controls/ChartControls';
import LoadingOverlay from '../../common/LoadingOverlay';

const EmptyState = ({ suggestions, onSuggestionClick }) => (
  <Box sx={{ 
    height: 400, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 2 
  }}>
    <Typography color="text.secondary">
      Select columns to visualize data
    </Typography>
    {suggestions?.length > 0 && (
      <Button 
        startIcon={<LightbulbIcon />}
        onClick={() => onSuggestionClick(suggestions[0])}
        variant="outlined"
        color="primary"
      >
        Try a Suggestion
      </Button>
    )}
  </Box>
);

const ChartVisualization = () => {
  const { data } = useData();
  const {
    currentChart,
    selectedColumns,
    activeSuggestion,
    analysis,
    isLoading,
    error,
    clearError,
    suggestions,
    handleSuggestionClick,
    setSelectedColumns
  } = useChart();


  const handleExport = async () => {
    try {
      const chartContainer = document.querySelector('.chart-container');
      if (!chartContainer) return;

      // Implementation will depend on your export requirements
      console.log('Exporting chart...');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleSaveView = () => {
    try {
      const viewConfig = {
        type: currentChart,
        columns: selectedColumns,
        suggestion: activeSuggestion,
        timestamp: new Date().toISOString()
      };
      // Implementation will depend on your save requirements
      console.log('Saving view config:', viewConfig);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const getChartProps = () => {
    const baseProps = {
      data,
      analysis: analysis?.columns
    };

    // Handle different chart types
    if (currentChart === 'pie') {
      return {
        ...baseProps,
        columns: {
          dimension: selectedColumns.x,
          value: selectedColumns.y === 'count' ? undefined : selectedColumns.y
        }
      };
    }

    // Handle other chart types
    return {
      ...baseProps,
      columns: selectedColumns
    };
  };

  const renderChart = () => {
    // Validate data and columns
    if (!data?.length || !selectedColumns) {
      return <EmptyState suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />;
    }

    // Check required columns based on chart type
    const requiresY = currentChart !== 'pie';
    if (!selectedColumns.x || (requiresY && !selectedColumns.y)) {
      return <EmptyState suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />;
    }

    const props = getChartProps();

    // Render appropriate chart component
    switch (currentChart) {
      case 'bar':
        return <BarChart 
        data={data}
        columns={selectedColumns}
        {...props} />;
      case 'line':
        return <LineChart {...props} />;
      case 'scatter':
        return <ScatterPlot {...props} />;
      case 'pie':
        return <PieChart
        data={data}
        columns={
          {
            dimension: selectedColumns.x,
            value: selectedColumns.y
          }
        }

        />;
      default:
        console.warn('Unknown chart type:', currentChart);
        return null;
    }
  };

  return (
    <>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={clearError}
          variant="outlined"
        >
          {error}
        </Alert>
      )}

      <Paper className='d2Chart' sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {activeSuggestion ? activeSuggestion.title : 'Custom Visualization'}
          </Typography>
          <Box>
            <Tooltip title="Download Chart">
              <IconButton 
                onClick={handleExport} 
                disabled={isLoading || !data?.length}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save View">
              <IconButton 
                onClick={handleSaveView} 
                disabled={isLoading || !data?.length}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box 
          sx={{ 
            height: 400, 
            position: 'relative',
            backgroundColor: 'background.default',
            borderRadius: 1,
            overflow: 'hidden'
          }} 
          className="chart-container"
        >
          {isLoading && <LoadingOverlay />}
          {renderChart()}
        </Box>

        {activeSuggestion && (
          <Alert 
            severity="info" 
            sx={{ mt: 2 }}
            action={
              <Button color="inherit" size="small">
                Learn More
              </Button>
            }
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2">
                {activeSuggestion.description}
              </Typography>
              {activeSuggestion.insights?.map((insight, index) => (
                <Typography key={index} variant="caption" color="text.secondary">
                  • {insight.description}
                </Typography>
              ))}
            </Box>
          </Alert>
        )}
      </Paper>

      <ChartControls
        type={currentChart}
        columns={Object.keys(data?.[0] || {})}
        selected={selectedColumns}
        onChange={setSelectedColumns}
        analysis={analysis?.columns}
      />
    </>
  );
};

export default ChartVisualization;