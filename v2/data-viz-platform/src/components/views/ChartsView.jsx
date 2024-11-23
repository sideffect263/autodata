// src/components/views/ChartsView.jsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Tab,
  Tabs,
  Button,
  Chip,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  BubbleChart as ScatterPlotIcon,
  PieChart as PieChartIcon,
  Lightbulb as LightbulbIcon,
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

// Import chart components
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import ScatterPlot from '../charts/ScatterPlot';
import PieChart from '../charts/PieChart';
import ChartControls from '../controls/ChartControls';

// Optional: Import a loading component
import LoadingOverlay from '../common/LoadingOverlay';

const ChartsView = ({ data, analysis }) => {
  // State management
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate chart suggestions based on data analysis
  const generateSuggestions = useMemo(() => {
    if (!data || !data.length) return [];

    const columns = Object.keys(data[0]);
    const suggestions = [];

    // Helper functions
    const isNumeric = (column) => typeof data[0][column] === 'number';
    const isDate = (column) => !isNaN(Date.parse(data[0][column]));
    const getUniqueValuesCount = (column) => new Set(data.map(item => item[column])).size;

    const numericColumns = columns.filter(isNumeric);
    const dateColumns = columns.filter(isDate);
    const categoricalColumns = columns.filter(col => !isNumeric(col) && !isDate(col));

    // Bar chart suggestions
    columns.forEach(xCol => {
      numericColumns.forEach(yCol => {
        if (xCol !== yCol) {
          suggestions.push({
            type: 'bar',
            title: `${yCol} by ${xCol}`,
            description: `Compare ${yCol} across different ${xCol} values`,
            columns: {
              x: xCol,
              y: yCol,
              group: ''
            }
          });
        }
      });
    });

    // Line chart suggestions
    const timeColumns = [...dateColumns, ...numericColumns];
    timeColumns.forEach(xCol => {
      numericColumns.forEach(yCol => {
        if (xCol !== yCol) {
          suggestions.push({
            type: 'line',
            title: `${yCol} over ${xCol}`,
            description: `Track changes in ${yCol} over ${xCol}`,
            columns: {
              x: xCol,
              y: yCol,
              group: ''
            }
          });
        }
      });
    });

    // Scatter plot suggestions
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        suggestions.push({
          type: 'scatter',
          title: `${numericColumns[i]} vs ${numericColumns[j]}`,
          description: `Explore relationship between these metrics`,
          columns: {
            x: numericColumns[i],
            y: numericColumns[j],
            group: ''
          }
        });
      }
    }

    // Pie chart suggestions
    categoricalColumns.forEach(catCol => {
      if (getUniqueValuesCount(catCol) <= 10) {
        numericColumns.forEach(numCol => {
          suggestions.push({
            type: 'pie',
            title: `Distribution of ${numCol} by ${catCol}`,
            description: `View how ${numCol} is distributed across ${catCol} categories`,
            columns: {
              x: catCol,
              y: numCol,
              group: ''
            }
          });
        });
      }
    });

    return suggestions;
  }, [data]);

  // Event handlers
  const handleChartTypeChange = (_, newType) => {
    setCurrentChart(newType);
    setActiveSuggestion(null);
    setSelectedColumns(prev => ({
      ...prev,
      x: '',
      y: '',
      group: ''
    }));
  };

  const handleSuggestionClick = (suggestion) => {
    setCurrentChart(suggestion.type);
    setSelectedColumns({
      ...selectedColumns,
      ...suggestion.columns
    });
    setActiveSuggestion(suggestion);
  };

  const handleControlsChange = (newColumns) => {
    setSelectedColumns(newColumns);
    setActiveSuggestion(null);
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      // Implement export logic here
      // For example, convert the chart to an image or export data
      setIsLoading(false);
    } catch (error) {
      setError('Failed to export chart');
      setIsLoading(false);
    }
  };

  const handleSaveView = () => {
    // Implement save view logic
    console.log('Saving current view:', {
      type: currentChart,
      columns: selectedColumns,
      settings: activeSuggestion
    });
  };

  // Render current chart
  const renderChart = () => {
    if (!data || !selectedColumns.x || !selectedColumns.y) {
      return (
        <Box sx={{ 
          height: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary">
            Select columns to visualize data
          </Typography>
        </Box>
      );
    }

    const props = {
      data,
      columns: selectedColumns
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

  if (!data || data.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Please upload data to create visualizations
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Grid container spacing={3}>
        {/* Left Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chart Types
            </Typography>
            <Tabs
              orientation="vertical"
              value={currentChart}
              onChange={handleChartTypeChange}
              sx={{ borderRight: 1, borderColor: 'divider' }}
            >
              <Tab icon={<BarChartIcon />} label="Bar Chart" value="bar" />
              <Tab icon={<LineChartIcon />} label="Line Chart" value="line" />
              <Tab icon={<ScatterPlotIcon />} label="Scatter Plot" value="scatter" />
              <Tab icon={<PieChartIcon />} label="Pie Chart" value="pie" />
            </Tabs>
          </Paper>

          {generateSuggestions.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LightbulbIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Suggested Visualizations
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {generateSuggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      bgcolor: activeSuggestion === suggestion ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {suggestion.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {suggestion.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
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

            <Box sx={{ height: 400, position: 'relative' }}>
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
                {activeSuggestion.description}
              </Alert>
            )}
          </Paper>

          <ChartControls
            type={currentChart}
            columns={Object.keys(data[0] || {})}
            selected={selectedColumns}
            onChange={handleControlsChange}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChartsView;