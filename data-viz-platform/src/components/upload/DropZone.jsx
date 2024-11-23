// src/components/upload/DropZone.jsx
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

const DropZone = ({ onDataProcessed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const resetState = () => {
    setError(null);
    setProgress(0);
    setIsProcessing(false);
  };

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
    resetState();
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 1) {
      setError('Please upload only one file at a time');
      return;
    }

    const file = files[0];
    await handleFileProcess(file);
  }, []);

  const handleFileProcess = async (file) => {
    setIsProcessing(true);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 200);

      const result = await processFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      onDataProcessed(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Paper
      elevation={3}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
      {isProcessing ? (
        <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Processing file...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 1 }} 
          />
          <Typography variant="body2" color="text.secondary">
            {progress}% complete
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
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default DropZone;