// src/components/views/ThreeDView/ThreeDView.jsx
import React, { Suspense, useMemo, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, IconButton, Tooltip, Alert, LinearProgress } from '@mui/material';
import { CameraAlt, Refresh, Save } from '@mui/icons-material';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  GizmoHelper, 
  GizmoViewport,
  Bounds 
} from '@react-three/drei';
import ControlPanel from './ThreeDView/ControlPanel';
import Suggestions from './ThreeDView/Suggestions';
import ErrorBoundary from '../common/ErrorBoundary';
import { useThreeD, ThreeDProvider } from './ThreeDView/context/ThreeDContext';
import LoadingSpinner from '../common/LoadingSpinner';

// Lazy load visualization components
const ScatterPlot3D = React.lazy(() => import('../visualizations/3d/ScatterPlot3D'));
const BarChart3D = React.lazy(() => import('../visualizations/3d/BarChart3D'));
const SurfacePlot3D = React.lazy(() => import('../visualizations/3d/SurfacePlot3D'));

// Memoized Scene component
const Scene = React.memo(({ settings, children }) => {
  const { showGrid, showAxes, enableShadows } = settings.display;

  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight 
        position={[10, 10, 10]} 
        intensity={1} 
        castShadow={enableShadows} 
      />
      <spotLight
        position={[-10, 10, -10]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow={enableShadows}
      />
      {showGrid && (
        <gridHelper 
          args={[20, 20]} 
          position={[0, -0.01, 0]}
          visible={showGrid}
        />
      )}
      {showAxes && <axesHelper args={[5]} visible={showAxes} />}
      <Bounds fit clip observe damping={6}>
        {children}
      </Bounds>
    </group>
  );
});

// Memoized Toolbar component
const Toolbar = React.memo(({ isValid, isLoading, onScreenshot, onResetCamera, onSaveView }) => (
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
      boxShadow: 1,
      zIndex: 10
    }}
  >
    {isValid ? (
      <>
        <Tooltip  title="Take Screenshot">
          <IconButton size="small" onClick={onScreenshot} disabled={isLoading}>
            <CameraAlt />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset Camera">
          <IconButton size="small" onClick={onResetCamera} disabled={isLoading}>
            <Refresh />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save View">
          <IconButton size="small" onClick={onSaveView} disabled={isLoading}>
            <Save />
          </IconButton>
        </Tooltip>
      </>
    ) : (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton size="small" disabled><CameraAlt /></IconButton>
        <IconButton size="small" disabled><Refresh /></IconButton>
        <IconButton size="small" disabled><Save /></IconButton>
      </Box>
    )}
  </Box>
));

// Visualization container component
const VisualizationContainer = React.memo(({ data, visualizationType, columns, settings }) => {
  const props = useMemo(() => ({
    data,
    columns,
    settings: {
      pointSize: settings.display.pointSize,
      wireframe: settings.display.wireframe,
      opacity: settings.display.opacity,
      colorScheme: settings.display.colorScheme
    },
    performanceSettings: settings.performance
  }), [data, columns, settings]);

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
});

// Main content component
const ThreeDViewContent = React.memo(({ data }) => {
  const {
    visualizationType,
    columns,
    settings,
    isLoading,
    error,
    isValid,
    hasData,
    handleSettingChange,
    loadSuggestions
  } = useThreeD();

  // Load suggestions effect
  useEffect(() => {
    if (data && hasData) {
      loadSuggestions();
    }
  }, [data, hasData, loadSuggestions]);

  // Handlers
  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `3d-viz-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    handleSettingChange('camera', 'position', [15, 15, 15]);
    handleSettingChange('camera', 'target', [0, 0, 0]);
  }, [handleSettingChange]);

  const handleSaveView = useCallback(() => {
    // Implement save functionality
  }, []);

  // Canvas configuration
  const canvasConfig = useMemo(() => ({
    shadows: settings.display.enableShadows,
    dpr: settings.performance.pixelRatio,
    gl: {
      antialias: settings.display.antialias,
      preserveDrawingBuffer: true
    },
    camera: {
      position: settings.camera.position,
      fov: settings.camera.fov,
      near: settings.camera.near,
      far: settings.camera.far
    }
  }), [settings]);

  if (!hasData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Please upload data to create 3D visualizations
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      {isLoading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid className='autoSuggestions' item xs={12}>
          <Suggestions />
        </Grid>

        <Grid  item xs={12} md={9}>
          <Paper 
          className='d3Visualization'
            elevation={3}
            sx={{
              height: '70vh',
              position: 'relative',
              overflow: 'hidden',
              bgcolor: settings.display.backgroundColor
            }}
          >
            <Toolbar
              isValid={isValid}
              isLoading={isLoading}
              onScreenshot={handleScreenshot}
              onResetCamera={handleResetCamera}
              onSaveView={handleSaveView}
            />

            {!isValid && !isLoading ? (
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                zIndex: 1 
              }}>
                <Alert severity="info">
                  Please select X, Y, and Z dimensions to create visualization
                </Alert>
              </Box>
            ) : (
              <ErrorBoundary>
                <Canvas {...canvasConfig}>
                  <Suspense fallback={null}>
                    <Scene settings={settings}>
                      {isValid && (
                        <VisualizationContainer
                          data={data}
                          visualizationType={visualizationType}
                          columns={columns}
                          settings={settings}
                        />
                      )}
                    </Scene>
                  </Suspense>

                  <OrbitControls
                    enableDamping={settings.controls.enableDamping}
                    dampingFactor={settings.controls.dampingFactor}
                    autoRotate={settings.controls.autoRotate}
                    autoRotateSpeed={settings.controls.rotateSpeed}
                    enableZoom={settings.controls.enableZoom}
                    zoomSpeed={settings.controls.zoomSpeed}
                    enablePan={settings.controls.enablePan}
                    panSpeed={settings.controls.panSpeed}
                  />

                  <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                    <GizmoViewport />
                  </GizmoHelper>
                </Canvas>
              </ErrorBoundary>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <ControlPanel />
        </Grid>
      </Grid>
    </Box>
  );
});

// Main component with provider
const ThreeDView = ({ data }) => (
  <ThreeDProvider>
    <ThreeDViewContent data={data} />
  </ThreeDProvider>
);

export default React.memo(ThreeDView);