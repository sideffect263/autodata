// src/App.jsx
import React, { useState } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import  theme  from './theme/theme';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import DataUpload from './components/upload/DataUpload';
import TableView from './components/views/TableView';
import ChartsView from './components/views/ChartsView';
import ThreeDView from './components/views/ThreeDView';
import SettingsView from './components/views/SettingsView';

const App = () => {
  // State management
  const [currentView, setCurrentView] = useState('upload');
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Handle data processing from upload
  const handleDataProcessed = async (result) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate the data structure
      if (!result || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('Invalid data format or empty dataset');
      }

      // Set the data and analysis
      setData(result.data);
      setAnalysis(result.analysis);

      // Show success notification
      setNotification({
        open: true,
        message: 'Data loaded successfully!',
        severity: 'success'
      });

      // Automatically switch to table view after successful upload
      setCurrentView('table');
    } catch (err) {
      setError(err.message);
      setNotification({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view changes from sidebar
  const handleViewChange = (newView) => {
    // Prevent switching to data views if no data is loaded
    if (!data && ['2d', '3d', 'table'].includes(newView)) {
      setNotification({
        open: true,
        message: 'Please upload data first',
        severity: 'warning'
      });
      return;
    }

    setCurrentView(newView);
    setError(null); // Clear any existing errors
  };

  // Render the appropriate view based on currentView state
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%' 
        }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (currentView) {
      case 'upload':
        return <DataUpload onDataProcessed={handleDataProcessed} />;
      case 'table':
        return <TableView data={data} analysis={analysis} />;
      case '2d':
        return <ChartsView data={data} analysis={analysis} />;
      case '3d':
        return <ThreeDView data={data} analysis={analysis} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DataUpload onDataProcessed={handleDataProcessed} />;
    }
  };

  // Handle notification close
  const handleNotificationClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification({ ...notification, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar 
          currentView={currentView}
          onViewChange={handleViewChange}
          dataLoaded={!!data}
        />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <AppHeader />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3, 
              marginTop: '64px',
              backgroundColor: 'background.default',
              overflow: 'auto'
            }}
          >
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
        </Box>
      </Box>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;