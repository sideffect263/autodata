// src/components/views/ThreeDView/components/ControlPanel.jsx
import React, { useState } from 'react';
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
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Settings,
  Timeline,
  ViewInAr,
  Palette,
  Speed,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useThreeD } from './context/ThreeDContext';

// Constants for visualization types
const VISUALIZATION_TYPES = {
  scatter: {
    label: '3D Scatter Plot',
    icon: ViewInAr,
    description: 'Visualize data points in 3D space'
  },
  bar: {
    label: '3D Bar Chart',
    icon: Timeline,
    description: 'Compare values with 3D bars'
  },
  surface: {
    label: 'Surface Plot',
    icon: ViewInAr,
    description: 'View data as a continuous 3D surface'
  }
};

const ControlPanel = () => {
  const {
    visualizationType,
    columns,
    settings,
    availableColumns = [],
    setVisualizationType,
    handleColumnChange,
    handleSettingChange,
  } = useThreeD();

  // Local state for panel sections
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    visualization: true,
    mapping: true,
    display: true,
    camera: false,
    performance: false
  });

  // Handle section toggle
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle visualization type change
  const handleVisualizationChange = (event) => {
    setVisualizationType(event.target.value);
  };

  // Render section header with toggle
  const SectionHeader = ({ title, section, tooltip = '' }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Tooltip title={tooltip}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Tooltip>
      <IconButton 
        size="small" 
        onClick={() => toggleSection(section)}
        sx={{ transform: expandedSections[section] ? 'rotate(180deg)' : 'none' }}
      >
        {expandedSections[section] ? <ExpandLess /> : <ExpandMore />}
      </IconButton>
    </Box>
  );

  return (
    <Card className="Toolbar" sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent>
        {/* Visualization Type Section */}
        <SectionHeader 
          title="Visualization Type" 
          section="visualization"
          tooltip="Choose your 3D visualization type"
        />
        <Collapse in={expandedSections.visualization}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={visualizationType}
              onChange={handleVisualizationChange}
              label="Type"
            >
              {Object.entries(VISUALIZATION_TYPES).map(([type, info]) => (
                <MenuItem key={type} value={type}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <info.icon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body1">{info.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {info.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* Data Mapping Section */}
        <SectionHeader 
          title="Data Mapping" 
          section="mapping"
          tooltip="Map your data columns to 3D axes"
        />
        <Collapse in={expandedSections.mapping}>
          <Grid container spacing={2}>
            {['x', 'y', 'z'].map((axis) => (
              <Grid item xs={12} key={axis}>
                <FormControl fullWidth>
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
              </Grid>
            ))}
          </Grid>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* Display Settings Section */}
        <SectionHeader 
          title="Display Settings" 
          section="display"
          tooltip="Customize visualization appearance"
        />
        <Collapse in={expandedSections.display}>
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
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.display.enableShadows}
                    onChange={(e) => handleSettingChange('display', 'enableShadows', e.target.checked)}
                  />
                }
                label="Enable Shadows"
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
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Opacity</Typography>
              <Slider
                value={settings.display.opacity}
                onChange={(_, value) => handleSettingChange('display', 'opacity', value)}
                min={0}
                max={1}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* Camera Settings Section */}
        <SectionHeader 
          title="Camera Settings" 
          section="camera"
          tooltip="Adjust camera and view settings"
        />
        <Collapse in={expandedSections.camera}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.controls.autoRotate}
                    onChange={(e) => handleSettingChange('controls', 'autoRotate', e.target.checked)}
                  />
                }
                label="Auto Rotate"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Rotation Speed</Typography>
              <Slider
                value={settings.controls.rotateSpeed}
                onChange={(_, value) => handleSettingChange('controls', 'rotateSpeed', value)}
                min={0}
                max={5}
                step={0.1}
                disabled={!settings.controls.autoRotate}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Zoom Speed</Typography>
              <Slider
                value={settings.controls.zoomSpeed}
                onChange={(_, value) => handleSettingChange('controls', 'zoomSpeed', value)}
                min={0.1}
                max={2}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* Performance Settings Section */}
        <SectionHeader 
          title="Performance" 
          section="performance"
          tooltip="Adjust performance settings"
        />
        <Collapse in={expandedSections.performance}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.display.antialias}
                    onChange={(e) => handleSettingChange('display', 'antialias', e.target.checked)}
                  />
                }
                label="Antialiasing"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Pixel Ratio</Typography>
              <Slider
                value={settings.performance.pixelRatio}
                onChange={(_, value) => handleSettingChange('performance', 'pixelRatio', value)}
                min={1}
                max={2}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;