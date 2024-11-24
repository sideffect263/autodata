// src/App.jsx
import React, { useState } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box,
  Alert
} from '@mui/material';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import DataUpload from './components/upload/DataUpload';
import TableView from './components/views/TableView';
import ChartsView from './components/views/ChartsView';
import ThreeDView from './components/views/ThreeDView';
import SettingsView from './components/views/SettingsView';

const AppContent = () => {
  const { theme, settings } = useSettings();
  const [currentView, setCurrentView] = useState('upload');
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleDataProcessed = async (result) => {
    try {
      setData(result.data);
      setAnalysis(result.analysis);
      setCurrentView('2d');
    } catch (err) {
      setError('Error processing data: ' + err.message);
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    switch (currentView) {
      case 'upload':
        return <DataUpload onDataProcessed={handleDataProcessed} />;
      case '2d':
        return <ChartsView data={data} analysis={analysis} />;
      case '3d':
        return <ThreeDView data={data} analysis={analysis} />;
      case 'table':
        return <TableView data={data} analysis={analysis} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DataUpload onDataProcessed={handleDataProcessed} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
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
              transition: settings.animations ? 'all 0.2s ease-in-out' : 'none'
            }}
          >
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;