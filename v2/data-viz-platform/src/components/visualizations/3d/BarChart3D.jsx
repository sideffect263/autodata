// src/components/visualizations/3d/BarChart3D.jsx
import React, { useMemo, useState } from 'react';
import { Vector3 } from 'three';
import { Html } from '@react-three/drei';

const BarChart3D = ({ data, columns, colorScheme = 'default' }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  
  const bars = useMemo(() => {
    if (!data || !columns.x || !columns.y || !columns.z) return [];

    // Get all values for each axis
    const xValues = data.map(d => d[columns.x]);
    const yValues = data.map(d => d[columns.y]);
    const zValues = data.map(d => d[columns.z]);

    // Find min/max for each axis
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);

    // Normalize function
    const normalize = (value, min, max) => ((value - min) / (max - min)) * 10 - 5;

    return {
      bars: data.map((point, index) => ({
        position: [
          normalize(point[columns.x], xMin, xMax),
          normalize(point[columns.y], yMin, yMax) / 2, // Divide by 2 because height is centered
          normalize(point[columns.z], zMin, zMax)
        ],
        height: normalize(point[columns.y], yMin, yMax),
        originalValues: {
          x: point[columns.x],
          y: point[columns.y],
          z: point[columns.z],
          ...point
        },
        index
      })),
      axisRanges: {
        x: { min: xMin, max: xMax, label: columns.x },
        y: { min: yMin, max: yMax, label: columns.y },
        z: { min: zMin, max: zMax, label: columns.z }
      }
    };
  }, [data, columns]);

  // Add axes labels and grid lines
  const AxisLabels = ({ ranges }) => (
    <group>
      {/* X-axis label */}
      <Html position={[5, -5.5, -5]}>
        <div style={{
          background: 'rgba(255,255,255,0.8)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {ranges.x.label}: {ranges.x.min.toFixed(2)} to {ranges.x.max.toFixed(2)}
        </div>
      </Html>
      {/* Y-axis label */}
      <Html position={[-5.5, 5, -5]}>
        <div style={{
          background: 'rgba(255,255,255,0.8)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {ranges.y.label}: {ranges.y.min.toFixed(2)} to {ranges.y.max.toFixed(2)}
        </div>
      </Html>
      {/* Z-axis label */}
      <Html position={[-5.5, -5.5, 5]}>
        <div style={{
          background: 'rgba(255,255,255,0.8)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {ranges.z.label}: {ranges.z.min.toFixed(2)} to {ranges.z.max.toFixed(2)}
        </div>
      </Html>
    </group>
  );

  // If no data or invalid columns, return null
  if (!bars.bars?.length) return null;

  return (
    <group>
      <AxisLabels ranges={bars.axisRanges} />
      {bars.bars.map((bar, index) => (
        <group key={index}>
          <mesh
            position={bar.position}
            onPointerOver={() => setHoveredBar(bar)}
            onPointerOut={() => setHoveredBar(null)}
          >
            <boxGeometry args={[0.5, Math.abs(bar.height), 0.5]} />
            <meshStandardMaterial 
              color={hoveredBar === bar ? '#ff4444' : colorScheme === 'default' ? '#1976d2' : colorScheme}
              metalness={0.5}
              roughness={0.5}
              emissive={hoveredBar === bar ? '#ff4444' : '#000000'}
              emissiveIntensity={hoveredBar === bar ? 0.5 : 0}
            />
          </mesh>
          {hoveredBar === bar && (
            <Html position={bar.position}>
              <div style={{
                background: 'white',
                padding: '8px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}>
                {Object.entries(bar.originalValues).map(([key, value]) => (
                  <div key={key}>{key}: {typeof value === 'number' ? value.toFixed(2) : value}</div>
                ))}
              </div>
            </Html>
          )}
        </group>
      ))}
      {/* Add coordinate grid lines */}
      <gridHelper args={[10, 10, '#444444', '#222222']} position={[0, -5, 0]} />
      <gridHelper args={[10, 10, '#444444', '#222222']} position={[0, 0, -5]} rotation={[Math.PI / 2, 0, 0]} />
      <gridHelper args={[10, 10, '#444444', '#222222']} position={[-5, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
    </group>
  );
};

export default BarChart3D;