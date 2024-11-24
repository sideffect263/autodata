// src/components/upload/DataUpload.jsx
import React, { useState } from 'react';
import { 
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
} from '@mui/material';
import DropZone from './DropZone';
import DataSourceSelector from './DataSourceSelector';
import { processFile } from '../../utils/fileHandlers';

const DataUpload = ({ onDataProcessed }) => {
  const [uploadError, setUploadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSource, setActiveSource] = useState(null);

  const handleDataSourceSelect = async (source) => {
    setIsLoading(true);
    setUploadError(null);
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
          // Cloud service data processing would go here
          throw new Error('Cloud service integration coming soon');
          
        default:
          throw new Error('Unsupported data source type');
      }

      // Validate and analyze the data
      if (!result || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('Invalid data format or empty dataset');
      }

      // Generate analysis
      const analysis = {
        rowCount: result.data.length,
        columns: Object.keys(result.data[0]),
        summary: {
          numericColumns: Object.keys(result.data[0]).filter(
            key => typeof result.data[0][key] === 'number'
          ),
          dateColumns: Object.keys(result.data[0]).filter(
            key => !isNaN(Date.parse(result.data[0][key]))
          ),
          categoricalColumns: Object.keys(result.data[0]).filter(
            key => typeof result.data[0][key] === 'string' && 
                  !isNaN(Date.parse(result.data[0][key]))
          )
        },
        metadata: {
          source: source.type,
          timestamp: new Date().toISOString(),
          ...(result.metadata || {})
        }
      };

      // If API source with auto-refresh, set up the refresh interval
      if (source.type === 'api' && source.config?.autoRefresh) {
        const intervalId = setInterval(() => {
          handleDataSourceSelect(source);
        }, source.config.refreshInterval * 1000);

        // Store interval ID for cleanup
        analysis.metadata.refreshIntervalId = intervalId;
      }

      // Pass data and analysis to parent
      onDataProcessed({
        data: result.data,
        analysis
      });
    } catch (error) {
      setUploadError(error.message);
      setActiveSource(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup function for auto-refresh intervals
  React.useEffect(() => {
    return () => {
      if (activeSource?.type === 'api' && activeSource.config?.autoRefresh) {
        clearInterval(activeSource.metadata?.refreshIntervalId);
      }
    };
  }, [activeSource]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Data Source Selection
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Choose your data source from the options below. You can upload local files,
          connect to an API, or access cloud storage services.
        </Typography>

        {/* Main data source selector */}
        <DataSourceSelector onDataProcessed={onDataProcessed} onDataSourceSelect={handleDataSourceSelect} />

        {/* Loading indicator */}
        {isLoading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 3 
          }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Error display */}
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

      {/* Data requirements and information */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Requirements
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          All data sources must provide structured data that meets the following requirements:
        </Typography>

        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Local file requirements */}
          <Box flex={1}>
            <Typography variant="subtitle2" gutterBottom>
              Local Files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Supported formats: CSV, JSON, Excel (.xlsx)<br />
              • Maximum file size: 10MB<br />
              • First row must contain column headers<br />
              • Consistent data formatting
            </Typography>
          </Box>

          {/* API requirements */}
          <Box flex={1}>
            <Typography variant="subtitle2" gutterBottom>
              API Connections
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Must return structured JSON data<br />
              • Authentication headers supported<br />
              • Optional auto-refresh functionality<br />
              • Custom data path navigation
            </Typography>
          </Box>

          {/* Cloud storage requirements */}
          <Box flex={1}>
            <Typography variant="subtitle2" gutterBottom>
              Cloud Storage
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Supported services: Google Drive, Dropbox, etc.<br />
              • Proper authentication required<br />
              • Same format requirements as local files<br />
              • Automatic file type detection
            </Typography>
          </Box>
        </Box>

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