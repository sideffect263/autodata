// src/components/views/ThreeDView.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Placeholder 3D scatter plot component
const ScatterPlot3D = ({ data, xColumn, yColumn, zColumn }) => {
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
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="blue" />
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
  const [cameraPosition, setCameraPosition] = useState({
    distance: 10,
    rotation: 0
  });
  const [showAxes, setShowAxes] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const availableColumns = data ? Object.keys(data[0] || {}) : [];

  const handleColumnChange = (axis) => (event) => {
    setColumns(prev => ({
      ...prev,
      [axis]: event.target.value
    }));
  };

  return (
    <Grid container spacing={2}>
      {/* Main 3D Viewport */}
      <Grid item xs={12} md={9}>
        <Paper sx={{ height: '70vh', overflow: 'hidden' }}>
          <Canvas camera={{ position: [10, 10, 10] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            {data && columns.x && columns.y && columns.z && (
              <ScatterPlot3D
                data={data}
                xColumn={columns.x}
                yColumn={columns.y}
                zColumn={columns.z}
              />
            )}
            {showAxes && <axesHelper args={[5]} />}
            <OrbitControls autoRotate={autoRotate} />
          </Canvas>
        </Paper>
      </Grid>

      {/* Controls Panel */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              3D Visualization Controls
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Visualization Type</InputLabel>
              <Select
                value={visualizationType}
                label="Visualization Type"
                onChange={(e) => setVisualizationType(e.target.value)}
              >
                <MenuItem value="scatter">3D Scatter Plot</MenuItem>
                <MenuItem value="surface">Surface Plot</MenuItem>
                <MenuItem value="bar">3D Bar Chart</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>X Axis</InputLabel>
              <Select
                value={columns.x}
                label="X Axis"
                onChange={handleColumnChange('x')}
              >
                {availableColumns.map(col => (
                  <MenuItem key={col} value={col}>{col}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Y Axis</InputLabel>
              <Select
                value={columns.y}
                label="Y Axis"
                onChange={handleColumnChange('y')}
              >
                {availableColumns.map(col => (
                  <MenuItem key={col} value={col}>{col}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Z Axis</InputLabel>
              <Select
                value={columns.z}
                label="Z Axis"
                onChange={handleColumnChange('z')}
              >
                {availableColumns.map(col => (
                  <MenuItem key={col} value={col}>{col}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography gutterBottom>Camera Distance</Typography>
            <Slider
              value={cameraPosition.distance}
              onChange={(_, value) => setCameraPosition(prev => ({ ...prev, distance: value }))}
              min={5}
              max={20}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={showAxes}
                  onChange={(e) => setShowAxes(e.target.checked)}
                />
              }
              label="Show Axes"
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                />
              }
              label="Auto Rotate"
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ThreeDView;