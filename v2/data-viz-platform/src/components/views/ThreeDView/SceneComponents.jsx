// src/components/views/ThreeDView/SceneComponents.jsx
import React from 'react';
import { Html } from '@react-three/drei';
import { useSettings } from '../../../contexts/SettingsContext';

export const SceneSetup = React.memo(({ children, settings }) => {
  const { settings: globalSettings } = useSettings();
  const isDarkMode = globalSettings.theme === 'dark';

  return (
    <>
      <color attach="background" args={[isDarkMode ? '#121212' : '#f8f9fa']} />
      <ambientLight intensity={0.5} />
      <pointLight 
        position={[10, 10, 10]} 
        intensity={1} 
        castShadow={settings.display.enableShadows} 
      />
      <spotLight
        position={[-10, 10, -10]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow={settings.display.enableShadows}
      />
      {settings.display.showAxes && <axesHelper args={[10]} />}
      {settings.display.showGrid && (
        <gridHelper 
          args={[20, 20, isDarkMode ? '#555555' : '#adb5bd', isDarkMode ? '#333333' : '#ced4da']} 
          position={[0, -0.1, 0]} 
        />
      )}
      {children}
    </>
  );
});

// Custom HTML label component that handles dark/light mode
export const AxisLabel = ({ position, content }) => {
  const { settings } = useSettings();
  const isDarkMode = settings.theme === 'dark';

  return (
    <Html position={position}>
      <div style={{
        background: isDarkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
        color: isDarkMode ? '#ffffff' : '#000000',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        {content}
      </div>
    </Html>
  );
};

export const DataLabel = ({ position, data }) => {
  const { settings } = useSettings();
  const isDarkMode = settings.theme === 'dark';

  return (
    <Html position={position}>
      <div style={{
        background: isDarkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
        color: isDarkMode ? '#ffffff' : '#000000',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            {key}: {typeof value === 'number' ? value.toFixed(2) : value}
          </div>
        ))}
      </div>
    </Html>
  );
};

export const LoadingOverlay = () => {
  const { settings } = useSettings();
  const isDarkMode = settings.theme === 'dark';

  return (
    <Html center>
      <div style={{
        background: isDarkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
        color: isDarkMode ? '#ffffff' : '#000000',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        Loading visualization...
      </div>
    </Html>
  );
};  

