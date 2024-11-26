// src/components/views/ChartsView/index.jsx
import React from 'react';
import { Box, Grid, Alert } from '@mui/material';
import { useData } from '../../../contexts/DataContext';
import ChartTypeSidebar from './ChartTypeSidebar';
import ChartVisualization from './ChartVisualization';
import { ChartProvider } from './ChartContext';

const ChartsView = () => {
  const { data, isLoading, error } = useData();

  if (!data || data.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Please upload data to create visualizations
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <ChartProvider>
      <Box sx={{ height: '100%', p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <ChartTypeSidebar />
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