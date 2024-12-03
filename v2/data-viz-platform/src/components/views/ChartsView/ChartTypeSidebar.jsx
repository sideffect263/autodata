
// src/components/views/ChartsView/ChartTypeSidebar.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  BubbleChart as ScatterPlotIcon,
  PieChart as PieChartIcon,
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useChart } from './ChartContext';

const ChartTypeSidebar = () => {
  const {
    currentChart,
    setCurrentChart,
    suggestions,
    activeSuggestion,
    handleSuggestionClick
  } = useChart();

  return (
    <>
      <Paper className='chartType' sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Chart Types
        </Typography>
        <Tabs
          orientation="vertical"
          value={currentChart}
          onChange={(_, value) => setCurrentChart(value)}
          sx={{ borderRight: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BarChartIcon />} label="Bar Chart" value="bar" />
          <Tab icon={<LineChartIcon />} label="Line Chart" value="line" />
          <Tab icon={<ScatterPlotIcon />} label="Scatter Plot" value="scatter" />
          <Tab icon={<PieChartIcon />} label="Pie Chart" value="pie" />
        </Tabs>
      </Paper>

      {suggestions.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LightbulbIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Auto Suggestions  
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                isActive={activeSuggestion?.id === suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
              />
            ))}
          </Box>
        </Paper>
      )}
    </>
  );
};

const SuggestionCard = ({ suggestion, isActive, onClick }) => (
  <Card
    variant="outlined"
    sx={{
      cursor: 'pointer',
      bgcolor: isActive ? 'action.selected' : 'background.paper',
      '&:hover': { bgcolor: 'action.hover' }
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2">
          {suggestion.title}
        </Typography>
        <Chip 
          size="small"
          label={`${Math.round(suggestion.score * 100)}%`}
          color={suggestion.score > 0.7 ? 'success' : 'default'}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {suggestion.description}
      </Typography>
      {suggestion.insights?.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
          <TrendingUpIcon fontSize="small" color="primary" />
          <Typography variant="caption" color="text.secondary">
            {suggestion.insights[0].description}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

export default ChartTypeSidebar;