// src/App.js
import React, { useState,Alert } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import AppHeader from './components/layout/AppHeader';
import Sidebar from './components/layout/Sidebar';
import DataUpload from './components/upload/DataUpload';
import ChartsView from './components/views/ChartsView';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
  },
});

function App() {
  // State management for data and view
  const [currentView, setCurrentView] = useState('upload');
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle data processing from upload
  const handleDataProcessed = (result) => {
    try {
      setIsLoading(true);
      setError(null);
      
      setData(result.data);
      setAnalysis(result.analysis);
      setCurrentView('2d'); // Automatically switch to 2D view after upload
    } catch (err) {
      setError('Error processing data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the appropriate view based on currentView state
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
        return <ChartsView 
          data={data} 
          analysis={analysis}
          isLoading={isLoading}
        />;
      case '3d':
        return <div>3D Visualization (Coming Soon)</div>;
      case 'table':
        return <div>Table View (Coming Soon)</div>;
      case 'settings':
        return <div>Settings (Coming Soon)</div>;
      default:
        return <DataUpload onDataProcessed={handleDataProcessed} />;
    }
  };

  // Handle view changes from sidebar
  const handleViewChange = (newView) => {
    setError(null); // Clear any existing errors
    setCurrentView(newView);
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
              backgroundColor: 'background.default'
            }}
          >
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;