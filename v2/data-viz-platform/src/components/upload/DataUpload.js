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
  LinearProgress,
  Card,
  CardContent,
  Button
} from '@mui/material';
import { useData } from '../../contexts/DataContext';
import DataSourceSelector from './DataSourceSelector';
import { processFile } from '../../utils/fileHandlers';
import Papa from 'papaparse';



const PRELOADED_DATASETS = [
  {
    id: 'iris',
    title: 'Iris Dataset',
    description: 'A classic dataset for classification tasks containing iris flower measurements.',
    file: '/datasets/Iris.csv', // Path to dataset file
  },
  {
    id: 'planets',
    title: 'Exoplanets Dataset',
    description: 'Astronomical data on exoplanets discovered by the Kepler space telescope.',
    file: '/datasets/planets.csv',
  },
  {
    id: 'cars',
    title: 'Cars Dataset',
    description: 'Specifications of various car models, ideal for regression analysis.',
    file: '/datasets/cars.csv',
  },
  {
    id: 'stocks',
    title: 'Stocks Dataset',
    description: 'Historical stock prices for technical and time-series analysis.',
    file: '/datasets/stocks.csv',
  },
];

const DataUpload = ({ onDataProcessed }) => {
  const { processData, isLoading, error, processingStatus } = useData();
  const [activeSource, setActiveSource] = useState(null);

  const handlePreloadedDatasetSelect = async (dataset) => {
    try {
      // Fetch the dataset file (mocked here for simplicity)
      const response = await fetch(dataset.file);

      console.log('Preloaded dataset fetched:', response);
      
      const fileContent = await response.text();

      console.log('Preloaded dataset content:', fileContent);

      
    // Parse the CSV data
    const parsedData = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });

    if (parsedData.errors.length > 0) {
      throw new Error('Error parsing CSV data');
    }


    console.log('Parsed dataset:', parsedData.data);

      const result = await processData(parsedData.data);

      console.log('Preloaded dataset processed:', result);

      if (!result.success) {
        throw new Error(result.error);
      }

      onDataProcessed(result.data);
    } catch (err) {
      console.error('Failed to load preloaded dataset:', err);
    }
  };

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
          result = {
            data: source.data,
            metadata: {
              source: 'api',
              config: source.config,
            },
          };
          break;

        case 'cloud':
          throw new Error('Cloud service integration coming soon');

        default:
          throw new Error('Unsupported data source type');
      }

      const processResult = await processData(result.data);

      if (!processResult.success) {
        throw new Error(processResult.error);
      }

      if (source.type === 'api' && source.config?.autoRefresh) {
        const intervalId = setInterval(() => {
          handleDataSourceSelect(source);
        }, source.config.refreshInterval * 1000);
        setActiveSource((prev) => ({ ...prev, intervalId }));
      }
    } catch (err) {
      console.error('Data processing failed:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (activeSource?.intervalId) {
        clearInterval(activeSource.intervalId);
      }
    };
  }, [activeSource]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Data Source Selection
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Choose your data source from the options below. You can upload local files,
          connect to an API, or access preloaded datasets for testing.
        </Typography>

        {isLoading && (
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {processingStatus.stage}... ({Math.round(processingStatus.progress)}%)
            </Typography>
            <LinearProgress variant="determinate" value={processingStatus.progress} />
          </Box>
        )}

        {!isLoading && (
          <DataSourceSelector onDataSourceSelect={handleDataSourceSelect} disabled={isLoading} />
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Upload Failed</AlertTitle>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Preloaded Datasets Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preloaded Datasets
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Choose from one of our preloaded datasets to test the platform's features.
        </Typography>

        <Grid container spacing={2}>
          {PRELOADED_DATASETS.map((dataset) => (
            <Grid item xs={12} sm={6} key={dataset.id}>
              <Card variant="outlined" sx={{ p: 2, '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {dataset.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {dataset.description}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handlePreloadedDatasetSelect(dataset)}
                  >
                    Load Dataset
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default DataUpload;
