// src/components/views/ThreeDView/components/ControlPanel.jsx
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
  Divider,
  Box,
  Tab,
  Tabs,
} from '@mui/material';
import { useThreeD } from './context/ThreeDContext';

const ControlPanel = () => {
  const {
    visualizationType,
    columns,
    settings,
    availableColumns = [],
    setVisualizationType,  // Note this change
    handleColumnChange,
    handleSettingChange,
  } = useThreeD();

  const [activeTab, setActiveTab] = React.useState(0);

  const handleVisualizationChange = (event) => {
    setVisualizationType(event.target.value);
  };

  return (
    <Card className='Toolbar'>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Visualization Type
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={visualizationType}
            onChange={handleVisualizationChange}
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
        {['x', 'y', 'z'].map((axis) => (
          <FormControl key={axis} fullWidth sx={{ mb: 2 }}>
            <InputLabel>{axis.toUpperCase()} Axis</InputLabel>
            <Select
              value={columns[axis] || ''}
              onChange={(e) => handleColumnChange(axis, e.target.value)}
              label={`${axis.toUpperCase()} Axis`}
            >
              <MenuItem value="">None</MenuItem>
              {availableColumns.map(column => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}

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
                  onChange={(e) => handleSettingChange('display', 'showGrid', e.target.checked)}
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
                  onChange={(e) => handleSettingChange('display', 'showAxes', e.target.checked)}
                />
              }
              label="Show Axes"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>Point Size</Typography>
            <Slider
              value={settings.display.pointSize}
              onChange={(_, value) => handleSettingChange('display', 'pointSize', value)}
              min={0.1}
              max={2}
              step={0.1}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;