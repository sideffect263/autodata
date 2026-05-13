// src/contexts/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

const defaultSettings = {
  theme: 'light',
  chartType: '2d',
  performance: 'balanced',
  autoRefresh: false,
  dataLimit: 1000,
  animations: false,
  autoSuggest: false,
};

// Create default theme
const defaultTheme = createTheme({
  palette: {
    mode: defaultSettings.theme,
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  }
});

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [theme, setTheme] = useState(defaultTheme); // Initialize with default theme

  useEffect(() => {
    // Load saved settings on mount
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          setSettings(prev => ({
            ...defaultSettings,
            ...JSON.parse(savedSettings)
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Update theme whenever settings change
  useEffect(() => {
    const newTheme = createTheme({
      palette: {
        mode: settings.theme,
        primary: {
          main: '#1976d2',
        },
        background: {
          default: settings.theme === 'dark' ? '#121212' : '#f5f5f5',
          paper: settings.theme === 'dark' ? '#1e1e1e' : '#ffffff',
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              transition: 'all 0.2s ease-in-out',
            },
          },
        },
      },
    });
    setTheme(newTheme);
  }, [settings.theme]);

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('appSettings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, theme }}>
      {children}
    </SettingsContext.Provider>
  );
};