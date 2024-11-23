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
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';

const SettingsView = () => {
  const [settings, setSettings] = useState({
    theme: {
      mode: 'light',
      primaryColor: '#1976d2',
      chartColors: ['#1976d2', '#dc004e', '#388e3c', '#f57c00', '#7b1fa2'],
    },
    visualization: {
      defaultView: '2d',
      animationsEnabled: true,
      autoSaveEnabled: true,
      maxDataPoints: 1000,
    },
    export: {
      imageFormat: 'png',
      imageQuality: 'high',
      includeMetadata: true,
    }
  });

  const [savedMessage, setSavedMessage] = useState(false);

  const handleChange = (section, field) => (event) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: event.target.value || event.target.checked
      }
    }));
  };

  const handleSave = () => {
    // In a real app, you'd save to localStorage or backend here
    localStorage.setItem('vizAppSettings', JSON.stringify(settings));
    setSavedMessage(true);
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      theme: {
        mode: 'light',
        primaryColor: '#1976d2',
        chartColors: ['#1976d2', '#dc004e', '#388e3c', '#f57c00', '#7b1fa2'],
      },
      visualization: {
        defaultView: '2d',
        animationsEnabled: true,
        autoSaveEnabled: true,
        maxDataPoints: 1000,
      },
      export: {
        imageFormat: 'png',
        imageQuality: 'high',
        includeMetadata: true,
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Application Settings
        </Typography>
        
        <Grid container spacing={3}>
          {/* Theme Settings */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Theme Settings
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Theme Mode</InputLabel>
              <Select
                value={settings.theme.mode}
                label="Theme Mode"
                onChange={handleChange('theme', 'mode')}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System Default</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Primary Color"
              type="color"
              value={settings.theme.primaryColor}
              onChange={handleChange('theme', 'primaryColor')}
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Visualization Settings */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Visualization Settings
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Default View</InputLabel>
              <Select
                value={settings.visualization.defaultView}
                label="Default View"
                onChange={handleChange('visualization', 'defaultView')}
              >
                <MenuItem value="2d">2D Charts</MenuItem>
                <MenuItem value="3d">3D Visualizations</MenuItem>
                <MenuItem value="table">Table View</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.visualization.animationsEnabled}
                  onChange={handleChange('visualization', 'animationsEnabled')}
                />
              }
              label="Enable Animations"
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.visualization.autoSaveEnabled}
                  onChange={handleChange('visualization', 'autoSaveEnabled')}
                />
              }
              label="Auto-save Views"
              sx={{ mb: 1 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Max Data Points"
              value={settings.visualization.maxDataPoints}
              onChange={handleChange('visualization', 'maxDataPoints')}
            />
          </Grid>

          {/* Export Settings */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Export Settings
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Image Format</InputLabel>
              <Select
                value={settings.export.imageFormat}
                label="Image Format"
                onChange={handleChange('export', 'imageFormat')}
              >
                <MenuItem value="png">PNG</MenuItem>
                <MenuItem value="jpeg">JPEG</MenuItem>
                <MenuItem value="svg">SVG</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Image Quality</InputLabel>
              <Select
                value={settings.export.imageQuality}
                label="Image Quality"
                onChange={handleChange('export', 'imageQuality')}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.export.includeMetadata}
                  onChange={handleChange('export', 'includeMetadata')}
                />
              }
              label="Include Metadata"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save Settings
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={savedMessage}
        autoHideDuration={3000}
        onClose={() => setSavedMessage(false)}
      >
        <Alert severity="success" onClose={() => setSavedMessage(false)}>
          Settings saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsView;