
// src/components/visualizations/3d/BarChart3D.jsx
import React, { useMemo } from 'react';
import { Box, Cylinder } from '@react-three/drei';

const BarChart3D = ({ data, columns, colorScale, barWidth = 0.5, spacing = 0.2 }) => {
  const { x: xColumn, y: yColumn, z: zColumn, color: colorColumn } = columns;

  const bars = useMemo(() => {
    if (!data || !xColumn || !yColumn || !zColumn) return [];

    // Extract values for normalization
    const xValues = data.map(d => d[xColumn]);
    const yValues = data.map(d => d[yColumn]);
    const zValues = data.map(d => d[zColumn]);

    // Calculate ranges
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);

    // Normalize function
    const normalize = (value, min, max) => {
      return ((value - min) / (max - min) * 10) - 5;
    };

    return data.map((point, index) => ({
      position: [
        normalize(point[xColumn], xMin, xMax),
        normalize(point[yColumn], yMin, yMax) / 2, // Height divided by 2 since bars grow from bottom
        normalize(point[zColumn], zMin, zMax)
      ],
      height: normalize(point[yColumn], yMin, yMax),
      color: colorColumn ? colorScale(point[colorColumn]) : '#1976d2',
      originalValues: {
        x: point[xColumn],
        y: point[yColumn],
        z: point[zColumn]
      }
    }));
  }, [data, xColumn, yColumn, zColumn, colorColumn, colorScale]);

  return (
    <group>
      {bars.map((bar, index) => (
        <Box
          key={index}
          position={bar.position}
          args={[barWidth, bar.height, barWidth]}
        >
          <meshPhongMaterial
            color={bar.color}
            transparent
            opacity={0.8}
          />
        </Box>
      ))}
    </group>
  );
};

export default BarChart3D;