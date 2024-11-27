
// src/components/visualizations/3d/Axes3D.jsx
import React from 'react';
import { Text } from '@react-three/drei';

const Axes3D = ({ labels = { x: 'X', y: 'Y', z: 'Z' }, size = 5 }) => {
  const labelOffset = size + 0.5;
  
  return (
    <group>
      {/* X Axis */}
      <line>
        <bufferGeometry attach="geometry">
          <float32BufferAttribute attach="attributes-position" args={[[0, 0, 0, size, 0, 0]]} count={2} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="red" />
      </line>
      <Text position={[labelOffset, 0, 0]} fontSize={0.5} color="red">
        {labels.x}
      </Text>

      {/* Y Axis */}
      <line>
        <bufferGeometry attach="geometry">
          <float32BufferAttribute attach="attributes-position" args={[[0, 0, 0, 0, size, 0]]} count={2} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="green" />
      </line>
      <Text position={[0, labelOffset, 0]} fontSize={0.5} color="green">
        {labels.y}
      </Text>

      {/* Z Axis */}
      <line>
        <bufferGeometry attach="geometry">
          <float32BufferAttribute attach="attributes-position" args={[[0, 0, 0, 0, 0, size]]} count={2} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="blue" />
      </line>
      <Text position={[0, 0, labelOffset]} fontSize={0.5} color="blue">
        {labels.z}
      </Text>
    </group>
  );
};

export default Axes3D;