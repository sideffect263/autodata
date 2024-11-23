// src/components/visualizations/VisualizationManager.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  BubbleChart as ScatterPlotIcon,
  PieChart as PieChartIcon,
  ViewInAr as ThreeDIcon,
  Storage as TableIcon,
  Tune as SettingsIcon,
} from '@mui/icons-material';

// Import future visualization components here
import TableView from './TableView';  // We'll create this next

const VisualizationManager = ({ data, analysis }) => {
  const [currentView, setCurrentView] = useState('table');
  const [dimension, setDimension] = useState('2d');
  const [selectedColumns, setSelectedColumns] = useState([]);
  
  // Define available visualizations
  const visualizations2D = [
    { id: 'table', label: 'Table View', icon: TableIcon },
    { id: 'bar', label: 'Bar Chart', icon: BarChartIcon },
    { id: 'line', label: 'Line Chart', icon: LineChartIcon },
    { id: 'scatter', label: 'Scatter Plot', icon: ScatterPlotIcon },
    { id: 'pie', label: 'Pie Chart', icon: PieChartIcon },
  ];

  const visualizations3D = [
    { id: '3d-scatter', label: '3D Scatter', icon: ThreeDIcon },
    { id: '3d-bar', label: '3D Bar Chart', icon: ThreeDIcon },
    { id: '3d-surface', label: '3D Surface', icon: ThreeDIcon },
  ];

  const renderVisualization = () => {
    switch (currentView) {
      case 'table':
        return <TableView data={data} />;
      // We'll add more cases as we create other visualization components
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">
              {dimension === '2d' ? '2D' : '3D'} {currentView} visualization coming soon
            </Typography>
          </Box>
        );
    }
  };

  const handleViewChange = (_, newView) => {
    setCurrentView(newView);
  };

  const toggleDimension = () => {
    setDimension(prev => prev === '2d' ? '3d' : '2d');
    // Reset to first visualization of the new dimension
    setCurrentView(dimension === '2d' ? visualizations3D[0].id : visualizations2D[0].id);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Control Bar */}
      <Paper sx={{ mb: 2, p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title={`Switch to ${dimension === '2d' ? '3D' : '2D'}`}>
            <IconButton onClick={toggleDimension} color="primary">
              <ThreeDIcon />
            </IconButton>
          </Tooltip>
          
          <Tabs 
            value={currentView}
            onChange={handleViewChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {(dimension === '2d' ? visualizations2D : visualizations3D).map(viz => (
              <Tab
                key={viz.id}
                value={viz.id}
                icon={<viz.icon />}
                label={viz.label}
              />
            ))}
          </Tabs>

          <Tooltip title="Visualization Settings">
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Visualization Area */}
      <Grid container spacing={2}>
        {/* Main Visualization */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, minHeight: 500 }}>
            {renderVisualization()}
          </Paper>
        </Grid>

        {/* Controls Panel */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Visualization Controls
              </Typography>
              {/* We'll add controls here in the next step */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VisualizationManager;