// src/components/views/SettingsView.jsx
import React, { useState } from 'react';
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
import { useSettings } from '../../contexts/SettingsContext';

const SettingsView = () => {
  const { settings, updateSettings } = useSettings();
  const [currentTab, setCurrentTab] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSettingChange = (setting, value) => {
    updateSettings({ [setting]: value });
  };

  const handleSave = () => {
    try {
      // Settings are automatically saved by the context
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

  const handleReset = () => {
    updateSettings({
      theme: 'light',
      chartType: '2d',
      performance: 'balanced',
      autoRefresh: false,
      dataLimit: 1000,
      animations: false,
      autoSuggest: false,
    });
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
            value={settings.theme || 'light'}
            label="Theme"
            onChange={(e) => handleSettingChange('theme', e.target.value)}
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(settings.animations)}
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
            value={settings.chartType || '2d'}
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
              checked={Boolean(settings.autoSuggest)}
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
            value={settings.performance || 'balanced'}
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
              checked={Boolean(settings.autoRefresh)}
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

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
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

      <Paper sx={{ p: 3 }}>
        {tabs[currentTab].content}
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification}
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