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
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  // Generate chart suggestions based on data analysis and current chart type
  const generateSuggestions = useMemo(() => {
    if (!data || data.length === 0) return [];

    const columns = Object.keys(data[0]);
    const suggestions = [];

    // Helper functions
    const isNumeric = (column) => typeof data[0][column] === 'number';
    const isDate = (column) => !isNaN(Date.parse(data[0][column]));
    const getUniqueValuesCount = (column) => new Set(data.map(item => item[column])).size;

    const numericColumns = columns.filter(isNumeric);
    const dateColumns = columns.filter(isDate);
    const categoricalColumns = columns.filter(col => !isNumeric(col) && !isDate(col));

    switch (currentChart) {
      case 'bar':
        // Bar chart suggestions - numeric columns for y-axis, any column for x-axis
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
        break;

      case 'line':
        // Line chart suggestions - date/numeric x-axis with numeric y-axis
        const timeColumns = [...dateColumns, ...numericColumns];
        timeColumns.forEach(xCol => {
          numericColumns.forEach(yCol => {
            if (xCol !== yCol) {
              suggestions.push({
                type: 'line',
                title: `${yCol} over ${xCol}`,
                description: `Track ${yCol} changes over ${xCol}`,
                columns: {
                  x: xCol,
                  y: yCol,
                  group: ''
                }
              });
            }
          });
        });
        break;

      case 'scatter':
        // Scatter plot suggestions - numeric columns only
        for (let i = 0; i < numericColumns.length; i++) {
          for (let j = i + 1; j < numericColumns.length; j++) {
            suggestions.push({
              type: 'scatter',
              title: `${numericColumns[i]} vs ${numericColumns[j]}`,
              description: 'Explore relationship between variables',
              columns: {
                x: numericColumns[i],
                y: numericColumns[j],
                group: ''
              }
            });
          }
        }
        break;

      case 'pie':
        // Pie chart suggestions - categorical columns with numeric values
        categoricalColumns.forEach(catCol => {
          if (getUniqueValuesCount(catCol) <= 10) {
            numericColumns.forEach(numCol => {
              suggestions.push({
                type: 'pie',
                title: `${numCol} by ${catCol}`,
                description: `Distribution of ${numCol} across ${catCol} categories`,
                columns: {
                  x: catCol,
                  y: numCol,
                  group: ''
                }
              });
            });
          }
        });
        break;
    }

    return suggestions;
  }, [data, currentChart]);

  const handleSuggestionClick = (suggestion) => {
    setCurrentChart(suggestion.type);
    setSelectedColumns(suggestion.columns);
    setActiveSuggestion(suggestion);
  };

  const handleChartTypeChange = (_, value) => {
    setCurrentChart(value);
    setActiveSuggestion(null);
    // Reset selected columns when changing chart type
    setSelectedColumns({
      x: '',
      y: '',
      group: ''
    });
  };

  const renderChart = () => {
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
            onChange={setSelectedColumns}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChartsView;