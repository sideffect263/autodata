// src/components/views/ThreeDView.jsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Divider,
  Alert,
  Button,
  Chip
} from '@mui/material';
import {
  ViewInAr,
  Lightbulb,
  CameraAlt,
  Settings,
  Animation,
  ColorLens,
  Save,
  RestartAlt
} from '@mui/icons-material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import SurfacePlot from '../visualizations/SurfacePlot';

// 3D Visualization Components
const ScatterPlot3D = ({ data, xColumn, yColumn, zColumn, pointSize = 0.1 }) => {
  return (
    <group>
      {data?.map((point, index) => (
        <mesh
          key={index}
          position={[
            point[xColumn] / 10,
            point[yColumn] / 10,
            point[zColumn] / 10
          ]}
        >
          <sphereGeometry args={[pointSize, 16, 16]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      ))}
    </group>
  );
};

const BarChart3D = ({ data, xColumn, yColumn, zColumn }) => {
  return (
    <group>
      {data?.map((point, index) => (
        <mesh
          key={index}
          position={[
            point[xColumn] / 10,
            (point[yColumn] / 20),
            point[zColumn] / 10
          ]}
        >
          <boxGeometry args={[0.2, point[yColumn] / 10, 0.2]} />
          <meshStandardMaterial color="purple" />
        </mesh>
      ))}
    </group>
  );
};



const ThreeDView = ({ data, analysis }) => {
  const [visualizationType, setVisualizationType] = useState('scatter');
  const [columns, setColumns] = useState({
    x: '',
    y: '',
    z: ''
  });
  const [camera, setCamera] = useState({
    distance: 10,
    rotation: 0,
    perspective: true
  });
  const [surfaceOptions, setSurfaceOptions] = useState({
    color: '#1976d2',
    wireframe: false,
    smoothShading: true
  });
  const [showAxes, setShowAxes] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [pointSize, setPointSize] = useState(0.1);

  // Generate visualization suggestions based on data analysis
  const suggestions = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const columns = Object.keys(data[0]);
    const suggestions = [];

    // Helper function to check if a column is numeric
    const isNumeric = (column) => {
      return typeof data[0][column] === 'number';
    };

    // Get numeric columns
    const numericColumns = columns.filter(isNumeric);

    // Suggest 3D scatter plots for numeric triplets
    if (numericColumns.length >= 3) {
      suggestions.push({
        type: 'scatter',
        title: '3D Relationship Analysis',
        description: `Explore relationships between ${numericColumns[0]}, ${numericColumns[1]}, and ${numericColumns[2]}`,
        columns: {
          x: numericColumns[0],
          y: numericColumns[1],
          z: numericColumns[2]
        }
      });
    }

    // Suggest 3D bar charts for categorical + 2 numeric columns
    const categoricalColumns = columns.filter(col => !isNumeric(col));
    if (categoricalColumns.length >= 1 && numericColumns.length >= 2) {
      suggestions.push({
        type: 'bar',
        title: '3D Bar Chart Analysis',
        description: `Compare ${numericColumns[0]} and ${numericColumns[1]} across different ${categoricalColumns[0]} categories`,
        columns: {
          x: categoricalColumns[0],
          y: numericColumns[0],
          z: numericColumns[1]
        }
      });
    }

    return suggestions;
  }, [data]);

  const handleSuggestionClick = (suggestion) => {
    setVisualizationType(suggestion.type);
    setColumns(suggestion.columns);
    setActiveSuggestion(suggestion);
  };

  const renderVisualization = () => {
    const props = {
      data,
      xColumn: columns.x,
      yColumn: columns.y,
      zColumn: columns.z,
      pointSize
    };

    switch (visualizationType) {
      case 'scatter':
        return <ScatterPlot3D {...props} />;
      case 'bar':
        return <BarChart3D {...props} />;
      case 'surface':
        return <SurfacePlot {...props} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Left Sidebar - Suggestions & Presets */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ViewInAr color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                3D Visualizations
              </Typography>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Visualization Type</InputLabel>
              <Select
                value={visualizationType}
                label="Visualization Type"
                onChange={(e) => {
                  setVisualizationType(e.target.value);
                  setActiveSuggestion(null);
                }}
              >
                <MenuItem value="scatter">3D Scatter Plot</MenuItem>
                <MenuItem value="bar">3D Bar Chart</MenuItem>
                <MenuItem value="surface">Surface Plot</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {suggestions.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lightbulb color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Suggested Views
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {suggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      bgcolor: activeSuggestion === suggestion ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {suggestion.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {suggestion.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Main Content - 3D Viewport & Controls */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ height: '70vh', overflow: 'hidden', position: 'relative' }}>
            {/* Toolbar */}
            <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1, display: 'flex', gap: 1 }}>
              <Tooltip title="Take Screenshot">
                <IconButton>
                  <CameraAlt />
                </IconButton>
              </Tooltip>
              <Tooltip title="Save View">
                <IconButton>
                  <Save />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset Camera">
                <IconButton onClick={() => setCamera({ distance: 10, rotation: 0, perspective: true })}>
                  <RestartAlt />
                </IconButton>
              </Tooltip>
            </Box>

            {/* 3D Canvas */}
            <Canvas camera={{ position: [camera.distance, camera.distance, camera.distance] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              {data && columns.x && columns.y && columns.z && renderVisualization()}
              {showAxes && <axesHelper args={[5]} />}
              {showGrid && <gridHelper args={[10, 10]} />}
              <OrbitControls 
                autoRotate={autoRotate} 
                autoRotateSpeed={2}
                enableDamping
              />
              <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport />
              </GizmoHelper>
            </Canvas>
          </Paper>

          {/* Controls Panel */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Data Mapping
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>X Axis</InputLabel>
                      <Select
                        value={columns.x}
                        label="X Axis"
                        onChange={(e) => setColumns(prev => ({ ...prev, x: e.target.value }))}
                      >
                        {data && Object.keys(data[0] || {}).map(col => (
                          <MenuItem key={col} value={col}>
                            {col}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>Y Axis</InputLabel>
                      <Select
                        value={columns.y}
                        label="Y Axis"
                        onChange={(e) => setColumns(prev => ({ ...prev, y: e.target.value }))}
                      >
                        {data && Object.keys(data[0] || {}).map(col => (
                          <MenuItem key={col} value={col}>
                            {col}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>Z Axis</InputLabel>
                      <Select
                        value={columns.z}
                        label="Z Axis"
                        onChange={(e) => setColumns(prev => ({ ...prev, z: e.target.value }))}
                      >
                        {data && Object.keys(data[0] || {}).map(col => (
                          <MenuItem key={col} value={col}>
                            {col}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Display Options
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAxes}
                          onChange={(e) => setShowAxes(e.target.checked)}
                        />
                      }
                      label="Show Axes"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showGrid}
                          onChange={(e) => setShowGrid(e.target.checked)}
                        />
                      }
                      label="Show Grid"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoRotate}
                          onChange={(e) => setAutoRotate(e.target.checked)}
                        />
                      }
                      label="Auto Rotate"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={camera.perspective}
                          onChange={(e) => setCamera(prev => ({ ...prev, perspective: e.target.checked }))}
                        />
                      }
                      label="Perspective"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Typography gutterBottom>Point Size</Typography>
                  <Slider
                    value={pointSize}
                    onChange={(_, value) => setPointSize(value)}
                    min={0.01}
                    max={0.5}
                    step={0.01}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ThreeDView;