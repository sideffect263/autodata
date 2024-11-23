// src/components/views/ThreeDView/ThreeDView.jsx
import React, { useState, useMemo, Suspense } from 'react';
import {
  Box,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  CameraAlt,
  Refresh,
  Save,
} from '@mui/icons-material';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  GizmoHelper, 
  GizmoViewport,
  PerspectiveCamera,
} from '@react-three/drei';

// Import our components
import { SceneSetup, LoadingOverlay } from './ThreeDView/SceneComponents';
import { ControlPanel } from './ThreeDView/ControlPanel';
import { Suggestions } from './ThreeDView/Suggestions';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Import visualizations
import ScatterPlot3D from '../visualizations/3d/ScatterPlot3D';
import BarChart3D from '../visualizations/3d/BarChart3D';
import SurfacePlot3D from '../visualizations/3d/SurfacePlot3D';

// Import utilities and constants
import { defaultSettings, generateSuggestions } from './ThreeDView/utils';

const ThreeDView = ({ data, analysis }) => {
  // State management
  const [settings, setSettings] = useState(defaultSettings);
  const [visualizationType, setVisualizationType] = useState('scatter');
  const [columns, setColumns] = useState({ x: '', y: '', z: '' });
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [error, setError] = useState(null);

  // Analyze columns for numeric data
  const columnAnalysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    const analysis = {};
    const columns = Object.keys(data[0]);

    columns.forEach(column => {
      const values = data.map(row => row[column]);
      analysis[column] = {
        type: typeof values[0],
        isNumeric: values.every(v => typeof v === 'number'),
        min: values.every(v => typeof v === 'number') ? Math.min(...values) : null,
        max: values.every(v => typeof v === 'number') ? Math.max(...values) : null,
        unique: new Set(values).size
      };
    });

    return analysis;
  }, [data]);

  // Generate visualization suggestions
  const suggestions = useMemo(() => 
    generateSuggestions(data, columnAnalysis),
    [data, columnAnalysis]
  );

  // Event handlers
  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSuggestionClick = (suggestion) => {
    setVisualizationType(suggestion.type);
    setColumns(suggestion.columns);
    setActiveSuggestion(suggestion);
  };

  const handleVisualizationChange = (type) => {
    setVisualizationType(type);
    setActiveSuggestion(null);
    if (type !== visualizationType) {
      setColumns({ x: '', y: '', z: '' });
    }
  };

  const handleColumnChange = (axis, value) => {
    setColumns(prev => ({
      ...prev,
      [axis]: value
    }));
    setActiveSuggestion(null);
  };

  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `3d-visualization-${visualizationType}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleResetCamera = () => {
    setSettings(prev => ({
      ...prev,
      camera: defaultSettings.camera
    }));
  };

  // Render the appropriate visualization
  const renderVisualization = () => {
    if (!columns.x || !columns.y || !columns.z) return null;

    const props = {
      data,
      columns,
      pointSize: settings.display.pointSize,
      wireframe: settings.display.wireframe,
      opacity: settings.display.opacity,
    };

    try {
      switch (visualizationType) {
        case 'scatter':
          return <ScatterPlot3D {...props} />;
        case 'bar':
          return <BarChart3D {...props} />;
        case 'surface':
          return <SurfacePlot3D {...props} />;
        default:
          return null;
      }
    } catch (error) {
      console.error('Error rendering visualization:', error);
      setError(error.message);
      return null;
    }
  };

  // Show loading or error states
  if (!data || data.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Please upload data to create 3D visualizations
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Grid container spacing={2}>
        {/* Suggestions Section */}
        {suggestions.length > 0 && (
          <Grid item xs={12}>
            <Suggestions
              suggestions={suggestions}
              activeSuggestion={activeSuggestion}
              onSuggestionClick={handleSuggestionClick}
            />
          </Grid>
        )}

        {/* Main 3D Viewport */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={3}
            sx={{ 
              height: '70vh', 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <ErrorBoundary>
              <Canvas
                shadows={settings.display.enableShadows}
                dpr={settings.performance.pixelRatio}
                gl={{ 
                  antialias: settings.display.antialias,
                  preserveDrawingBuffer: true
                }}
              >
                <PerspectiveCamera
                  makeDefault
                  position={settings.camera.position}
                  fov={settings.camera.fov}
                  near={settings.camera.near}
                  far={settings.camera.far}
                />
                
                <Suspense fallback={<LoadingOverlay />}>
                  <SceneSetup settings={settings}>
                    {renderVisualization()}
                  </SceneSetup>
                </Suspense>
                
                <OrbitControls
                  enableDamping={settings.controls.enableDamping}
                  dampingFactor={settings.controls.dampingFactor}
                  autoRotate={settings.controls.autoRotate}
                  autoRotateSpeed={settings.controls.rotateSpeed}
                  enableZoom={settings.controls.enableZoom}
                  zoomSpeed={settings.controls.zoomSpeed}
                />
                
                <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                  <GizmoViewport />
                </GizmoHelper>
              </Canvas>
            </ErrorBoundary>

            {/* Toolbar */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1,
                backgroundColor: 'rgba(255,255,255,0.9)',
                p: 1,
                borderRadius: 1,
                boxShadow: 1
              }}
            >
              <Tooltip title="Take Screenshot">
                <IconButton size="small" onClick={handleScreenshot}>
                  <CameraAlt />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reset Camera">
                <IconButton size="small" onClick={handleResetCamera}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Save View">
                <IconButton size="small">
                  <Save />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>

        {/* Controls Panel */}
        <Grid item xs={12} md={3}>
          <ControlPanel
            visualizationType={visualizationType}
            columns={columns}
            settings={settings}
            columnAnalysis={columnAnalysis}
            onVisualizationChange={handleVisualizationChange}
            onColumnChange={handleColumnChange}
            onSettingChange={handleSettingChange}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ThreeDView;