// src/components/visualizations/3d/ScatterPlot3D.jsx
import React, { useMemo, useState } from 'react';
import { Vector3 } from 'three';
import { Html } from '@react-three/drei';

const ScatterPlot3D = ({ data, columns, pointSize = 0.1, colorScheme = 'default' }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  const points = useMemo(() => {
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

    // Add axis labels and grid lines
    return {
      points: data.map((point, index) => ({
        position: [
          normalize(point[columns.x], xMin, xMax),
          normalize(point[columns.y], yMin, yMax),
          normalize(point[columns.z], zMin, zMax)
        ],
        originalValues: {
          x: point[columns.x],
          y: point[columns.y],
          z: point[columns.z],
          ...point // Keep all original data for tooltip
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

  return (
    <group>
      <AxisLabels ranges={points.axisRanges} />
      {points.points.map((point, index) => (
        <group key={index}>
          <mesh
            position={point.position}
            scale={[pointSize, pointSize, pointSize]}
            onPointerOver={() => setHoveredPoint(point)}
            onPointerOut={() => setHoveredPoint(null)}
          >
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial 
              color={hoveredPoint === point ? '#ff4444' : colorScheme === 'default' ? '#1976d2' : colorScheme}
              metalness={0.5}
              roughness={0.5}
              emissive={hoveredPoint === point ? '#ff4444' : '#000000'}
              emissiveIntensity={hoveredPoint === point ? 0.5 : 0}
            />
          </mesh>
          {hoveredPoint === point && (
            <Html position={point.position}>
              <div style={{
                background: 'white',
                padding: '8px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}>
                {Object.entries(point.originalValues).map(([key, value]) => (
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

export default ScatterPlot3D;