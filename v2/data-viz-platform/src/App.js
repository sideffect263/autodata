import React,{useState} from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box,
  Alert,
  
} from '@mui/material';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ChartProvider } from './components/views/ChartsView/ChartContext';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import DataUpload from './components/upload/DataUpload';
import TableView from './components/views/TableView';
import ChartsView from './components/views/ChartsView';
import ThreeDView from './components/views/ThreeDView';
import SettingsView from './components/views/SettingsView';
import LoadingOverlay from './components/common/LoadingOverlay';
import ErrorBoundary from './components/common/ErrorBoundary';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import useMediaQuery from '@mui/material/useMediaQuery';

const ViewContent = () => {
  const { 
    currentView, 
    error, 
    isLoading, 
    data, 
    analysis,
    processingStatus,
    isDataReady 
  } = useData();



  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ m: 2 }}
      >
        {error}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <LoadingOverlay 
        message={processingStatus.stage ? 
          `Processing: ${processingStatus.stage} (${processingStatus.progress}%)` : 
          'Loading...'
        }
      />
    );
  }

  const needsData = currentView !== 'upload' && currentView !== 'settings';
  if (needsData && !isDataReady) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Please upload data to use this feature
      </Alert>
    );
  }

  switch (currentView) {
    case 'upload':
      return <DataUpload />;
    case 'd2':
      return <ChartsView />;
    case 'd3':
      return (
        <ErrorBoundary>
          <ThreeDView
            data={data}
            analysis={analysis}
          />
        </ErrorBoundary>
      );
    case 'table':
      return (
        <ErrorBoundary>
          <TableView 
            data={data} 
            analysis={analysis}
          />
        </ErrorBoundary>
      );
    case 'settings':
      return <SettingsView />;
    default:
      return <DataUpload />;
  }
};

const AppContent = () => {
  const { theme, settings } = useSettings();
  const { 
    currentView, 
    setCurrentView, 
    isLoading, 
    isDataReady,
    hasData,
  } = useData();

  // Detect screen size
  const isMobile = useMediaQuery('(max-width:600px)');

  const tutorials = {
    upload: [
      { intro: "Welcome to the Upload Page!" },
      { element: ".upload", intro: "Click here to upload your data or use preloaded datasets." },
      { element: ".PreloadedDatasets", intro: "Select a preloaded dataset to quickly start analyzing." },
    ],
    d2: [
      { intro: "Welcome to the 2D Charts Page!" },
      { element: ".d2Chart", intro: "Visualize your data with interactive 2D charts." },
      { element: ".ChartControls", intro: "Use these controls to customize your charts." },
    ],
    d3: [
      { intro: "Welcome to the 3D Visualizations Page!" },
      { element: ".d3Visualization", intro: "Explore advanced 3D visualizations of your data." },
      { element: ".Toolbar", intro: "Use these controls to interact with the 3D view." },
    ],
    table: [
      { intro: "Welcome to the Table View Page!" },
      { element: ".Table", intro: "View and analyze your data in a table format." },
    ],
    settings: [
      { intro: "Welcome to the Settings Page!" },
      { element: ".ThemeToggle", intro: "Switch between light and dark themes here." },
      { element: ".Preferences", intro: "Adjust your preferences to enhance your experience." },
    ],
  };

  const [mobileOpen, setMobileOpen] = useState(false);


  const startTutorial = () => {
    const steps = tutorials[currentView] || [{ intro: "No tutorial available for this page." }];

    if(isMobile && currentView === 'upload') {
      setMobileOpen(true);

    }
    introJs()
      .setOptions({
        steps,
        showProgress: true,
        nextLabel: "Next →",
        prevLabel: "← Back",
        doneLabel: "Finish",
        tooltipClass: isMobile ? 'introjs-tooltip-mobile' : 'introjs-tooltip-desktop',
        highlightClass: 'customHighlight',
        exitOnOverlayClick: false,
        showStepNumbers: true,
        overlayOpacity: 0.7,
        scrollToElement: true,
        scrollTo: 'tooltip',
        positionPrecedence: ['bottom', 'top', 'right', 'left'], // Favor bottom/top on mobile
      })
      .start();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar 
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          currentView={currentView}
          onViewChange={setCurrentView}
          dataLoaded={hasData}
          isLoading={isLoading}
        />
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          width: "100%",
          overflow: 'hidden',
        }}>
          <AppHeader onHelpClick={startTutorial} />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3, 
              marginTop: '64px',
              backgroundColor: 'background.default',
              transition: settings.animations ? 'all 0.2s ease-in-out' : 'none',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <ViewContent />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

const ChartViewProvider = ({ children }) => {
  const { hasData } = useData();
  
  if (!hasData) {
    return children;
  }

  return (
    <ChartProvider>
      {children}
    </ChartProvider>
  );
};

const ProvidersWrapper = ({ children }) => {
  return (
    <ErrorBoundary>
      <DataProvider>
        <SettingsProvider>
          <ChartViewProvider>
            {children}
          </ChartViewProvider>
        </SettingsProvider>
      </DataProvider>
    </ErrorBoundary>
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
