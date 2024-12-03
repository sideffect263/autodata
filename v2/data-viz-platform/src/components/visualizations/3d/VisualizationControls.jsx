
// src/components/visualizations/3d/VisualizationControls.jsx
import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';

const VisualizationControls = ({ 
  columns, 
  settings, 
  onSettingChange, 
  availableColumns 
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Data Mapping
      </Typography>
      {['x', 'y', 'z'].map(axis => (
        <FormControl fullWidth key={axis} sx={{ mb: 2 }}>
          <InputLabel>{axis.toUpperCase()} Axis</InputLabel>
          <Select
            value={columns[axis] || ''}
            onChange={(e) => onSettingChange('columns', {
              ...columns,
              [axis]: e.target.value
            })}
          >
            <MenuItem value="">None</MenuItem>
            {availableColumns.map(col => (
              <MenuItem key={col} value={col}>{col}</MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Display Settings
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={settings.showGrid}
            onChange={(e) => onSettingChange('showGrid', e.target.checked)}
          />
        }
        label="Show Grid"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings.showAxes}
            onChange={(e) => onSettingChange('showAxes', e.target.checked)}
          />
        }
        label="Show Axes"
      />

      <Typography gutterBottom sx={{ mt: 2 }}>
        Point Size
      </Typography>
      <Slider
        value={settings.pointSize}
        onChange={(_, value) => onSettingChange('pointSize', value)}
        min={0.1}
        max={2}
        step={0.1}
      />

      <Typography gutterBottom sx={{ mt: 2 }}>
        Camera FOV
      </Typography>
      <Slider
        value={settings.fov}
        onChange={(_, value) => onSettingChange('fov', value)}
        min={30}
        max={120}
        step={1}
      />
    </Box>
  );
};

export default VisualizationControls;