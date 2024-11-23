// src/components/views/ThreeDView/SceneComponents.jsx
import React from 'react';
import { Html } from '@react-three/drei';

export const ProfessionalBackground = () => (
  <>
    <color attach="background" args={['#f8f9fa']} />
    <fog attach="fog" args={['#f8f9fa', 20, 100]} />
    <hemisphereLight
      skyColor="#ffffff"
      groundColor="#bbbbbb"
      intensity={0.5}
      position={[0, 1, 0]}
    />
    <gridHelper 
      args={[100, 100, '#e9ecef', '#dee2e6']}
      position={[0, -10, 0]}
    />
  </>
);

export const SceneSetup = React.memo(({ children, settings }) => (
  <>
    <ProfessionalBackground />
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
        args={[20, 20, '#adb5bd', '#ced4da']} 
        position={[0, -0.1, 0]} 
      />
    )}
    {children}
  </>
));

export const LoadingOverlay = () => (
  <Html center>
    <div style={{
      background: 'rgba(255,255,255,0.8)',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      Loading visualization...
    </div>
  </Html>
);