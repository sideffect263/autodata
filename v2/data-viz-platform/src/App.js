// src/App.jsx
import React from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box,
  Alert
} from '@mui/material';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { DataProvider, useData } from './contexts/DataContext';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import DataUpload from './components/upload/DataUpload';
import TableView from './components/views/TableView';
import ChartsView from './components/views/ChartsView';
import ThreeDView from './components/views/ThreeDView';
import SettingsView from './components/views/SettingsView';

const AppContent = () => {
  const { theme, settings } = useSettings();
  const { 
    currentView, 
    setCurrentView, 
    error, 
    isLoading, 
    data, 
    analysis 
  } = useData();

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
        return <DataUpload />;
      case '2d':
        return <ChartsView data={data} analysis={analysis} />;
      case '3d':
        return <ThreeDView data={data} analysis={analysis} />;
      case 'table':
        return <TableView data={data} analysis={analysis} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DataUpload />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          dataLoaded={Boolean(data && analysis)}
          isLoading={isLoading}
        />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column',width:"100%" }}>
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

const ProvidersWrapper = ({ children }) => {
  return (
    <DataProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </DataProvider>
  );
};

const App = () => {
  return (
    <ProvidersWrapper>
      <AppContent />
    </ProvidersWrapper>
  );
};

export default App;