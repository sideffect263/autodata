// src/components/upload/DataUpload.jsx
import React, { useState } from 'react';
import { 
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle
} from '@mui/material';
import DropZone from './DropZone';

const DataUpload = ({ onDataProcessed }) => {
  const [uploadError, setUploadError] = useState(null);

  const handleDataProcessed = (result) => {
    try {
      // Validate the processed data
      if (!result || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('Invalid data format or empty dataset');
      }

      // Generate basic analysis
      const analysis = {
        rowCount: result.data.length,
        columns: Object.keys(result.data[0]),
        // Add more analysis as needed
      };

      // Pass both data and analysis up to parent
      onDataProcessed({
        data: result.data,
        analysis
      });
    } catch (error) {
      setUploadError(error.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Upload Your Data
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Drag and drop your data file here, or click to select a file. 
          Supported formats: CSV, JSON, and Excel files.
        </Typography>
        
        <DropZone onDataProcessed={handleDataProcessed} />
        
        {uploadError && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
            onClose={() => setUploadError(null)}
          >
            <AlertTitle>Upload Failed</AlertTitle>
            {uploadError}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Requirements
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Files should contain structured data in rows and columns<br />
          • Maximum file size: 10MB<br />
          • First row should contain column headers<br />
          • Numeric data should use consistent formatting<br />
          • Dates should be in a standard format (YYYY-MM-DD recommended)
        </Typography>
      </Paper>
    </Box>
  );
};

export default DataUpload;