// src/App.jsx
import { React, useState } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box
} from '@mui/material';
import { theme } from './theme';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import DataUpload from './components/upload/DataUpload';
import TableView from './components/views/TableView';
import ChartsView from './components/views/ChartsView';
import ThreeDView from './components/views/ThreeDView';
import SettingsView from './components/views/SettingsView';

const App = () => {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [currentView, setCurrentView] = useState('upload');

  const handleDataProcessed = (result) => {
    setData(result.data);
    setAnalysis(result.analysis);
    setCurrentView('2d'); // Automatically switch to 2D view after upload
  };

  const renderContent = () => {
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
              backgroundColor: 'background.default'
            }}
          >
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;