// src/components/views/ThreeDView/ControlPanel.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { styles } from './utils';

export const ControlPanel = ({
  visualizationType,
  columns,
  settings,
  columnAnalysis,
  onVisualizationChange,
  onColumnChange,
  onSettingChange
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Visualization Type
      </Typography>
      <FormControl fullWidth sx={styles.formControl}>
        <InputLabel>Type</InputLabel>
        <Select
          value={visualizationType}
          onChange={(e) => onVisualizationChange(e.target.value)}
          label="Type"
        >
          <MenuItem value="scatter">3D Scatter Plot</MenuItem>
          <MenuItem value="bar">3D Bar Chart</MenuItem>
          <MenuItem value="surface">Surface Plot</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Data Mapping
      </Typography>
      <Grid container spacing={2}>
        {['x', 'y', 'z'].map((axis) => (
          <Grid item xs={12} key={axis}>
            <FormControl fullWidth sx={styles.formControl}>
              <InputLabel>{axis.toUpperCase()} Axis</InputLabel>
              <Select
                value={columns[axis]}
                onChange={(e) => onColumnChange(axis, e.target.value)}
                label={`${axis.toUpperCase()} Axis`}
              >
                <MenuItem value="">None</MenuItem>
                {Object.entries(columnAnalysis || {}).map(([column, analysis]) => (
                  <MenuItem 
                    key={column} 
                    value={column}
                    disabled={!analysis.isNumeric}
                  >
                    {column} {!analysis.isNumeric && '(non-numeric)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Display Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.display.showGrid}
                onChange={(e) => onSettingChange('display', 'showGrid', e.target.checked)}
              />
            }
            label="Show Grid"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.display.showAxes}
                onChange={(e) => onSettingChange('display', 'showAxes', e.target.checked)}
              />
            }
            label="Show Axes"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.controls.autoRotate}
                onChange={(e) => onSettingChange('controls', 'autoRotate', e.target.checked)}
              />
            }
            label="Auto Rotate"
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Point Size</Typography>
          <Slider
            value={settings.display.pointSize}
            onChange={(_, value) => onSettingChange('display', 'pointSize', value)}
            min={0.1}
            max={2}
            step={0.1}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Camera FOV</Typography>
          <Slider
            value={settings.camera.fov}
            onChange={(_, value) => onSettingChange('camera', 'fov', value)}
            min={30}
            max={120}
            step={1}
          />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);