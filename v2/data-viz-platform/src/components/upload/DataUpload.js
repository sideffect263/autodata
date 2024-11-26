// src/components/upload/DataUpload.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress
} from '@mui/material';
import { useData } from '../../contexts/DataContext';
import DataSourceSelector from './DataSourceSelector';
import { processFile } from '../../utils/fileHandlers';

const DataUpload = ({ onDataProcessed }) => {
  const { 
    processData, 
    isLoading, 
    error,
    processingStatus 
  } = useData();
  const [activeSource, setActiveSource] = useState(null);

  const handleDataSourceSelect = async (source) => {
    setActiveSource(source);
    
    try {
      let result;
      
      switch (source.type) {
        case 'local':
          // Process local file upload
          result = await processFile(source.file);
          break;
          
        case 'api':
          // API data is already processed by the DataSourceSelector
          result = {
            data: source.data,
            metadata: {
              source: 'api',
              config: source.config
            }
          };
          break;
          
        case 'cloud':
          throw new Error('Cloud service integration coming soon');
          
        default:
          throw new Error('Unsupported data source type');
      }

      // Process data using the context's processData method
      const processResult = await processData(result.data);
      
      if (!processResult.success) {
        throw new Error(processResult.error);
      }

      // Handle API auto-refresh
      if (source.type === 'api' && source.config?.autoRefresh) {
        const intervalId = setInterval(() => {
          handleDataSourceSelect(source);
        }, source.config.refreshInterval * 1000);
        setActiveSource(prev => ({ ...prev, intervalId }));
      }

    } catch (err) {
      console.error('Data processing failed:', err);
    }
  };

  // Cleanup function for auto-refresh intervals
  useEffect(() => {
    return () => {
      if (activeSource?.intervalId) {
        clearInterval(activeSource.intervalId);
      }
    };
  }, [activeSource]);

  useEffect(() => {
    console.log('DataUpload rendered');
    console.log(isLoading);
  }, [isLoading, error]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Data Source Selection
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Choose your data source from the options below. You can upload local files,
          connect to an API, or access cloud storage services.
        </Typography>

        {/* Progress indicator */}
        {isLoading && (
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {processingStatus.stage}... ({Math.round(processingStatus.progress)}%)
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={processingStatus.progress} 
            />
          </Box>
        )}

        {/* Main data source selector */}
        {!isLoading && (
          <DataSourceSelector 
            onDataSourceSelect={handleDataSourceSelect}
            disabled={isLoading}
          />
        )}
        
        {/* Error display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
          >
            <AlertTitle>Upload Failed</AlertTitle>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Data requirements and information */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Requirements
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          All data sources must provide structured data that meets the following requirements:
        </Typography>

        <Grid container spacing={2}>
          {/* Local file requirements */}
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" gutterBottom>
              Local Files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Supported formats: CSV, JSON, Excel (.xlsx)<br />
              • Maximum file size: 10MB<br />
              • First row must contain column headers<br />
              • Consistent data formatting
            </Typography>
          </Grid>

          {/* API requirements */}
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" gutterBottom>
              API Connections
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Must return structured JSON data<br />
              • Authentication headers supported<br />
              • Optional auto-refresh functionality<br />
              • Custom data path navigation
            </Typography>
          </Grid>

          {/* Cloud storage requirements */}
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" gutterBottom>
              Cloud Storage
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Supported services: Google Drive, Dropbox, etc.<br />
              • Proper authentication required<br />
              • Same format requirements as local files<br />
              • Automatic file type detection
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          <strong>Note:</strong> For all data sources, dates should be in a standard format (YYYY-MM-DD recommended) 
          and numeric data should use consistent decimal and thousands separators.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DataUpload;