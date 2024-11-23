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
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Palette,
  DataUsage,
  Speed,
  Save,
  RestartAlt,
  FileDownload,
  Code,
  Share,
  Info
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import { colorManagement } from '../../utils/visualization3DUtils';

// Default settings
const defaultSettings = {
  appearance: {
    theme: 'light',
    primaryColor: '#1976d2',
    chartColors: colorManagement.schemes.categorical,
    background: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    chartSpacing: 24,
    animationsEnabled: true
  },
  visualization: {
    defaultView: '2d',
    defaultChart: 'bar',
    autoSuggestCharts: true,
    maxDataPoints: 10000,
    decimalPrecision: 2,
    loadingStrategy: 'progressive',
    enableSmoothing: true
  },
  performance: {
    enableWebGL: true,
    antialiasing: true,
    shadowQuality: 'medium',
    maxFPS: 60,
    enableInstancing: true,
    chunkSize: 1000
  },
  export: {
    defaultFormat: 'png',
    imageQuality: 'high',
    includeMetadata: true,
    exportScale: 2
  },
  dataSources: {
    allowedFileTypes: ['csv', 'json', 'xlsx'],
    maxFileSize: 10,
    enableAutoRefresh: false,
    cacheTimeout: 30
  }
};

const SettingsView = () => {
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('vizSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = localStorage.getItem('vizSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        showNotification('Error loading settings', 'error');
      }
    };
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    const savedSettings = localStorage.getItem('vizSettings');
    setHasChanges(JSON.stringify(settings) !== savedSettings);
  }, [settings]);

  // Notification helper
  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  // Handle settings changes
  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  // Save settings
  const handleSave = async () => {
    try {
      localStorage.setItem('vizSettings', JSON.stringify(settings));
      showNotification('Settings saved successfully');
      setHasChanges(false);

      // Trigger settings update event
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
    } catch (error) {
      showNotification('Error saving settings', 'error');
    }
  };

  // Reset settings
  const handleReset = () => {
    setSettings(defaultSettings);
    showNotification('Settings reset to defaults');
  };

  // Export settings
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'visualization-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Settings exported successfully');
  };

  // Import settings
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          showNotification('Settings imported successfully');
        } catch (error) {
          showNotification('Error importing settings', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { 
      label: 'Appearance', 
      icon: <Palette />, 
      content: (
        <AppearanceSettings 
          settings={settings.appearance} 
          onChange={(setting, value) => handleSettingChange('appearance', setting, value)}
          onColorPickerOpen={() => setColorPickerOpen(true)}
        />
      )
    },
    { 
      label: 'Visualization', 
      icon: <DataUsage />, 
      content: (
        <VisualizationSettings 
          settings={settings.visualization} 
          onChange={(setting, value) => handleSettingChange('visualization', setting, value)}
        />
      )
    },
    { 
      label: 'Performance', 
      icon: <Speed />, 
      content: (
        <PerformanceSettings 
          settings={settings.performance} 
          onChange={(setting, value) => handleSettingChange('performance', setting, value)}
        />
      )
    },
    { 
      label: 'Export', 
      icon: <FileDownload />, 
      content: (
        <ExportSettings 
          settings={settings.export} 
          onChange={(setting, value) => handleSettingChange('export', setting, value)}
        />
      )
    },
    { 
      label: 'Data Sources', 
      icon: <Code />, 
      content: (
        <DataSourceSettings 
          settings={settings.dataSources} 
          onChange={(setting, value) => handleSettingChange('dataSources', setting, value)}
        />
      )
    }
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Settings
          {hasChanges && (
            <Chip 
              label="Unsaved Changes" 
              color="warning" 
              size="small" 
              sx={{ ml: 2 }} 
            />
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            component="label"
          >
            Import
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleImport}
            />
          </Button>
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
            disabled={!hasChanges}
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

      {/* Color Picker Dialog */}
      {colorPickerOpen && (
        <Dialog
          open={colorPickerOpen}
          onClose={() => setColorPickerOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Choose Color</DialogTitle>
          <DialogContent>
            <ChromePicker
              color={settings.appearance.primaryColor}
              onChange={(color) => handleSettingChange('appearance', 'primaryColor', color.hex)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setColorPickerOpen(false)}>Done</Button>
          </DialogActions>
        </Dialog>
      )}

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