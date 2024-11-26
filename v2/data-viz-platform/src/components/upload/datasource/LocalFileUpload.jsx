// src/components/upload/datasource/LocalFileUpload.jsx
import React from 'react';
import { Box } from '@mui/material';
import DropZone from '../DropZone';

const LocalFileUpload = () => {
  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <DropZone />
    </Box>
  );
};

export default LocalFileUpload;
