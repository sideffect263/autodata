
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
    // Export implementation
  };

  const handleSaveView = () => {
    // Save view implementation
  };

  const renderChart = () => {
    if (!data || !selectedColumns.x || !selectedColumns.y) {
      return (
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
          {suggestions.length > 0 && (
            <Button 
              startIcon={<LightbulbIcon />}
              onClick={() => handleSuggestionClick(suggestions[0])}
            >
              Try a Suggestion
            </Button>
          )}
        </Box>
      );
    }

    const props = {
      data,
      columns: selectedColumns,
      analysis: analysis?.columns
    };

    switch (currentChart) {
      case 'bar':
        return <BarChart {...props} />;
      case 'line':
        return <LineChart {...props} />;
      case 'scatter':
        return <ScatterPlot {...props} />;
      case 'pie':
        return <PieChart {...props} />;
      default:
        return null;
    }
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {activeSuggestion ? activeSuggestion.title : 'Custom Visualization'}
          </Typography>
          <Box>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleExport} disabled={isLoading}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save View">
              <IconButton onClick={handleSaveView} disabled={isLoading}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ height: 400, position: 'relative' }} className="chart-container">
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
        columns={Object.keys(data[0] || {})}
        selected={selectedColumns}
        onChange={setSelectedColumns}
        analysis={analysis?.columns}
      />
    </>
  );
};

export default ChartVisualization;