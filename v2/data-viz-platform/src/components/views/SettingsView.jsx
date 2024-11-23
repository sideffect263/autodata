// src/components/views/SettingsView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Palette,
  DataUsage,
  Speed,
  Save,
  RestartAlt,
} from '@mui/icons-material';

// Default settings
const defaultSettings = {
  theme: 'light',
  chartType: '2d',
  performance: 'balanced',
  autoRefresh: false,
  dataLimit: 1000,
};

const SettingsView = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handle settings changes
  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Save settings
  const handleSave = () => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
      setNotification({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error saving settings',
        severity: 'error'
      });
    }
  };

  // Reset settings
  const handleReset = () => {
    setSettings(defaultSettings);
    setNotification({
      open: true,
      message: 'Settings reset to defaults',
      severity: 'info'
    });
  };

  const renderAppearanceSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Theme</InputLabel>
          <Select
            value={settings.theme}
            label="Theme"
            onChange={(e) => handleSettingChange('theme', e.target.value)}
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.animations}
              onChange={(e) => handleSettingChange('animations', e.target.checked)}
            />
          }
          label="Enable Animations"
        />
      </Grid>
    </Grid>
  );

  const renderVisualizationSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Default Chart Type</InputLabel>
          <Select
            value={settings.chartType}
            label="Default Chart Type"
            onChange={(e) => handleSettingChange('chartType', e.target.value)}
          >
            <MenuItem value="2d">2D Charts</MenuItem>
            <MenuItem value="3d">3D Visualizations</MenuItem>
            <MenuItem value="table">Table View</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoSuggest}
              onChange={(e) => handleSettingChange('autoSuggest', e.target.checked)}
            />
          }
          label="Auto-suggest Visualizations"
        />
      </Grid>
    </Grid>
  );

  const renderPerformanceSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Performance Mode</InputLabel>
          <Select
            value={settings.performance}
            label="Performance Mode"
            onChange={(e) => handleSettingChange('performance', e.target.value)}
          >
            <MenuItem value="balanced">Balanced</MenuItem>
            <MenuItem value="performance">High Performance</MenuItem>
            <MenuItem value="quality">High Quality</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoRefresh}
              onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
            />
          }
          label="Auto Refresh"
        />
      </Grid>
    </Grid>
  );

  const tabs = [
    {
      label: 'Appearance',
      icon: <Palette />,
      content: renderAppearanceSettings()
    },
    {
      label: 'Visualization',
      icon: <DataUsage />,
      content: renderVisualizationSettings()
    },
    {
      label: 'Performance',
      icon: <Speed />,
      content: renderPerformanceSettings()
    }
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RestartAlt />}
            onClick={handleReset}
            color="error"
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Settings Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, value) => setCurrentTab(value)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Settings Content */}
      <Paper sx={{ p: 3 }}>
        {tabs[currentTab].content}
      </Paper>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsView;