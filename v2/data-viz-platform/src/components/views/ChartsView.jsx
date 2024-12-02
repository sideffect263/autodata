// src/components/views/ChartsView.jsx
import React from 'react';
import { Box, Grid, Alert } from '@mui/material';
import { useData } from '../../contexts/DataContext';
import ChartTypeSidebar from './ChartsView/ChartTypeSidebar';
import ChartVisualization from './ChartsView/ChartVisualization';
import { ChartProvider } from './ChartsView/ChartContext';
import LoadingOverlay from '../common/LoadingOverlay';

const ChartsView = () => {
  const { data, isLoading, error } = useData();

  if (isLoading) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <LoadingOverlay message="Preparing visualization..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Please upload data to create visualizations
      </Alert>
    );
  }

  return (
    <ChartProvider>
      <Box  sx={{ height: '100%', p: 2 }}>
        <Grid   container spacing={3}>
          <Grid item xs={12} md={3}>
            <ChartTypeSidebar  />
          </Grid>
          <Grid item xs={12} md={9}>
            <ChartVisualization />
          </Grid>
        </Grid>
      </Box>
    </ChartProvider>
  );
};

export default ChartsView;