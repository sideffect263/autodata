// src/components/upload/DataSourceSelector.jsx
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Upload as UploadIcon,
  Api as ApiIcon,
  CloudQueue as CloudIcon
} from '@mui/icons-material';
import LocalFileUpload from './datasource/LocalFileUpload';
import ApiConnection from './datasource/ApiConnection';
import CloudStorage from './datasource/CloudStorage';

const DataSourceSelector = () => {
  const [sourceType, setSourceType] = useState('local');
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSourceTypeChange = (_, newValue) => {
    setSourceType(newValue);
    console.log(`Selected source type: ${newValue}`);
    setError(null);
  };

  const renderContent = () => {
    switch (sourceType) {
      case 'local':
        return <LocalFileUpload />;
      case 'api':
        return <ApiConnection />;
      case 'cloud':
        return <CloudStorage />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      <Tabs
        value={sourceType}
        onChange={handleSourceTypeChange}
        variant={isMobile ? 'scrollable' : 'fullWidth'}
        scrollButtons={isMobile ? 'auto' : 'off'}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab 
          icon={<UploadIcon />} 
          label="Local File" 
          value="local"
          iconPosition="start"
        />
        <Tab 
          icon={<ApiIcon />} 
          label="API" 
          value="api"
          iconPosition="start"
        />
        <Tab 
          icon={<CloudIcon />} 
          label="Cloud Storage" 
          value="cloud"
          iconPosition="start"
        />
      </Tabs>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {renderContent()}
    </Box>
  );
};

export default DataSourceSelector;