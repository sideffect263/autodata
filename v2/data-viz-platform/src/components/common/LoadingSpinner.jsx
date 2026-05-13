
// src/components/common/LoadingSpinner.jsx
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading visualization...' }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 200
    }}
  >
    <CircularProgress size={40} sx={{ mb: 2 }} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

export default LoadingSpinner;