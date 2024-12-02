
// src/hooks/useVisualizationSettings.js
import { useState } from 'react';

const defaultSettings = {
  cameraPosition: [15, 15, 15],
  fov: 10,
  autoRotate: false,
  rotationSpeed: 1,
  enableDamping: true,
  showGrid: true,
  showAxes: true,
  pointSize: 0.5,
  wireframe: false,
  colorScheme: 'default',
  backgroundColor: '#ffffff',
  enableShadows: true,
  antialias: true,
};

export const useVisualizationSettings = (initialSettings = {}) => {
  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...initialSettings
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return [settings, updateSetting];
};