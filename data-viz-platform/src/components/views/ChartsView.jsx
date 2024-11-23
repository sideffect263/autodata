// src/components/views/ChartsView.jsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Tab,
  Tabs,
  Button
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  BubbleChart as ScatterPlotIcon,
  PieChart as PieChartIcon,
  Lightbulb,
  Add,
  FileDownload,
  Info
} from '@mui/icons-material';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import ScatterPlot from '../charts/ScatterPlot';
import PieChart from '../charts/PieChart';
import ChartControls from '../controls/ChartControls';

const ChartsView = ({ data, analysis }) => {
  const [currentChart, setCurrentChart] = useState('bar');
  const [selectedColumns, setSelectedColumns] = useState({
    x: '',
    y: '',
    group: ''
  });
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  // Generate chart suggestions based on data analysis
  const generateSuggestions = useMemo(() => {
    if (!data || data.length === 0) return [];

    const columns = Object.keys(data[0]);
    const suggestions = [];

    // Helper function to check if a column is numeric
    const isNumeric = (column) => {
      return typeof data[0][column] === 'number';
    };

    // Helper function to check if a column is a date
    const isDate = (column) => {
      return !isNaN(Date.parse(data[0][column]));
    };

    // Helper function to get unique values count
    const getUniqueValuesCount = (column) => {
      return new Set(data.map(item => item[column])).size;
    };

    // Find numeric columns for distribution analysis
    const numericColumns = columns.filter(isNumeric);
    if (numericColumns.length > 0) {
      numericColumns.forEach(column => {
        suggestions.push({
          type: 'bar',
          title: `Distribution of ${column}`,
          description: `Analyze the distribution pattern of ${column} values`,
          columns: {
            x: column,
            y: 'count',
            group: ''
          }
        });
      });
    }

    // Find time series patterns
    const dateColumns = columns.filter(isDate);
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      dateColumns.forEach(dateCol => {
        numericColumns.forEach(numCol => {
          suggestions.push({
            type: 'line',
            title: `${numCol} over Time`,
            description: `Track how ${numCol} changes over time`,
            columns: {
              x: dateCol,
              y: numCol,
              group: ''
            }
          });
        });
      });
    }

    // Find potential correlations
    if (numericColumns.length > 1) {
      for (let i = 0; i < numericColumns.length - 1; i++) {
        suggestions.push({
          type: 'scatter',
          title: `${numericColumns[i]} vs ${numericColumns[i + 1]}`,
          description: 'Explore potential correlation between these metrics',
          columns: {
            x: numericColumns[i],
            y: numericColumns[i + 1],
            group: ''
          }
        });
      }
    }

    // Find categorical distributions
    const categoricalColumns = columns.filter(col => !isNumeric(col) && !isDate(col));
    categoricalColumns.forEach(col => {
      if (getUniqueValuesCount(col) <= 10) {
        suggestions.push({
          type: 'pie',
          title: `${col} Distribution`,
          description: `View the distribution of different ${col} categories`,
          columns: {
            x: col,
            y: 'count',
            group: ''
          }
        });
      }
    });

    return suggestions;
  }, [data]);

  const handleSuggestionClick = (suggestion) => {
    setCurrentChart(suggestion.type);
    setSelectedColumns(suggestion.columns);
    setActiveSuggestion(suggestion);
  };

  const renderChart = () => {
    switch (currentChart) {
      case 'bar':
        return <BarChart data={data} columns={selectedColumns} />;
      case 'line':
        return <LineChart data={data} columns={selectedColumns} />;
      case 'scatter':
        return <ScatterPlot data={data} columns={selectedColumns} />;
      case 'pie':
        return <PieChart data={data} columns={selectedColumns} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Grid container spacing={3}>
        {/* Left Sidebar - Chart Types & Suggestions */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chart Types
            </Typography>
            <Tabs
              orientation="vertical"
              value={currentChart}
              onChange={(_, value) => {
                setCurrentChart(value);
                setActiveSuggestion(null);
              }}
              sx={{ borderRight: 1, borderColor: 'divider' }}
            >
              <Tab icon={<BarChartIcon />} label="Bar Chart" value="bar" />
              <Tab icon={<LineChartIcon />} label="Line Chart" value="line" />
              <Tab icon={<ScatterPlotIcon />} label="Scatter Plot" value="scatter" />
              <Tab icon={<PieChartIcon />} label="Pie Chart" value="pie" />
            </Tabs>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Lightbulb color="primary" sx={{ mr: 1 }} />
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
        </Grid>

        {/* Main Content - Chart & Controls */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {activeSuggestion ? activeSuggestion.title : 'Custom Visualization'}
              </Typography>
              <Box>
                <Tooltip title="Download Chart">
                  <IconButton>
                    <FileDownload />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Save View">
                  <IconButton>
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Box sx={{ height: 400, position: 'relative' }}>
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
            onChange={(newColumns) => {
              setSelectedColumns(newColumns);
              setActiveSuggestion(null);
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChartsView;