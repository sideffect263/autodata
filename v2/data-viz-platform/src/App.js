// src/App.js
import React, { useState } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import AppHeader from './components/layout/AppHeader';
import Sidebar from './components/layout/Sidebar';

// Create theme
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
  const [currentView, setCurrentView] = useState('upload');
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleDataProcessed = (result) => {
    setData(result.data);
    setAnalysis(result.analysis);
    setCurrentView('2d');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return <div>Upload Component (Coming Soon)</div>;
      case '2d':
        return <div>2D Charts (Coming Soon)</div>;
      case '3d':
        return <div>3D Visualization (Coming Soon)</div>;
      case 'table':
        return <div>Table View (Coming Soon)</div>;
      case 'settings':
        return <div>Settings (Coming Soon)</div>;
      default:
        return <div>Upload Component (Coming Soon)</div>;
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