// src/components/upload/DropZone.js
import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Alert,
  Paper,
  LinearProgress 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { processFile } from '../../utils/fileHandlers';
import { useData } from '../../contexts/DataContext';

const DropZone = () => {
  const { processData, processingStatus, error: contextError } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    setLocalError(null);
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 1) {
      setLocalError('Please upload only one file at a time');
      return;
    }

    const file = files[0];
    await handleFileProcess(file);
  }, [processData]);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalError(null);
      await handleFileProcess(file);
    }
  }, [processData]);

  const handleFileProcess = async (file) => {
    try {
      const processed = await processFile(file);
      if (processed) {
        await processData(processed.data);
      }
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const error = localError || contextError;
  const isProcessing = processingStatus.isProcessing;
  const progress = processingStatus.progress;

  return (
    <Paper
      elevation={3}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input').click()}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '400px',
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : 'grey.300',
        backgroundColor: isDragging ? 'action.hover' : 'background.paper',
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer'
      }}
    >
      <input
        id="file-input"
        type="file"
        accept=".csv,.json,.xlsx,.xls"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {isProcessing ? (
        <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {processingStatus.stage || 'Processing file...'}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 1 }} 
          />
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}% complete
          </Typography>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Drop your file here
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            or click to select a file
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports CSV, JSON, and Excel files
          </Typography>
        </Box>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2, width: '100%', maxWidth: 400 }}
          onClose={() => setLocalError(null)}
        >
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default DropZone;