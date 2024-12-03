import React, { useEffect, useState } from 'react';
import { 
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  LinearProgress,
  Grid,
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

const API_SOURCES = [
  {
    id: 'data_usa',
    title: 'Data USA API',
    description: 'Comprehensive data on U.S. demographics, economy, education, and health.',
    endpoint: 'https://datausa.io/api/data?drilldowns=Nation&measures=Population',
  },
  {
    id: 'open_food_facts',
    title: 'Open Food Facts API',
    description: 'Global database of food products, including ingredients and nutrition.',
    endpoint: 'https://world.openfoodfacts.org/category/cheeses.json',
  },
  {
    id: 'coingecko',
    title: 'CoinGecko API',
    description: 'Cryptocurrency market data, including prices and historical trends.',
    endpoint: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd',
  },
];

const DataUpload = ({ onDataProcessed }) => {

  const { processData, isLoading, error, processingStatus } = useData();
  const [activeSource, setActiveSource] = useState(null);

  const handlePreloadedDatasetSelect = async (dataset) => {
    try {
      const response = await fetch(dataset.file);
      const fileContent = await response.text();

      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true
      });

      if (parsedData.errors.length > 0) {
        throw new Error('Error parsing CSV data');
      }

      const result = await processData(parsedData.data);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to load preloaded dataset:', err);
    }
  };

  const handleApiSelect = async (api) => {
    try {
      const response = await fetch(api.endpoint);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiData = await response.json();
      const result = await processData(apiData);

      if (!result.success) {
        throw new Error(result.error);
      }

    } catch (err) {
      console.error(`Failed to fetch data from ${api.title}:`, err);
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

        <DataSourceSelector onDataSourceSelect={setActiveSource} disabled={isLoading} />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Upload Failed</AlertTitle>
            {error}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preloaded Datasets
        </Typography>
        <Grid className='PreloadedDatasets' container spacing={2}>
          {PRELOADED_DATASETS.map((dataset) => (
            <Grid item xs={12} sm={6} key={dataset.id}>
              <Card variant="outlined" sx={{ p: 2, '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Typography variant="subtitle1">{dataset.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{dataset.description}</Typography>
                  <Button variant="contained" size="small" onClick={() => handlePreloadedDatasetSelect(dataset)}>
                    Load Dataset
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Sources
        </Typography>
        <Grid container spacing={2}>
          {API_SOURCES.map((api) => (
            <Grid item xs={12} sm={6} key={api.id}>
              <Card variant="outlined" sx={{ p: 2, '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Typography variant="subtitle1">{api.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{api.description}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                    Endpoint: {api.endpoint}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleApiSelect(api)}
                  >
                    Fetch Data
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
