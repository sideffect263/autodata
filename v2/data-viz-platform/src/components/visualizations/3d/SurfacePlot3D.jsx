// src/components/visualizations/3d/SurfacePlot3D.jsx
import React, { useMemo, useState } from 'react';
import { DoubleSide, Vector3, Color } from 'three';
import { Html } from '@react-three/drei';

const SurfacePlot3D = ({ 
  data, 
  columns, 
  wireframe = false, 
  colorScheme = 'default',
  resolution = 50 
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  
  // Process and normalize data for the surface
  const geometryData = useMemo(() => {
    if (!data || !columns.x || !columns.y || !columns.z) return null;

    try {
      // Extract unique x and y values to create a grid
      const xValues = [...new Set(data.map(d => d[columns.x]))].sort((a, b) => a - b);
      const yValues = [...new Set(data.map(d => d[columns.y]))].sort((a, b) => a - b);

      // Get min/max values for normalization
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      const zValues = data.map(d => d[columns.z]);
      const zMin = Math.min(...zValues);
      const zMax = Math.max(...zValues);

      // Create lookup table for z values
      const zLookup = new Map(
        data.map(d => [`${d[columns.x]},${d[columns.y]}`, d[columns.z]])
      );

      // Normalize function
      const normalize = (value, min, max) => ((value - min) / (max - min)) * 10 - 5;

      // Generate surface geometry
      const vertices = [];
      const indices = [];
      const colors = [];
      const normals = [];
      const uvs = [];
      const dataPoints = [];

      // Generate vertices grid
      for (let yi = 0; yi < yValues.length; yi++) {
        for (let xi = 0; xi < xValues.length; xi++) {
          const x = normalize(xValues[xi], xMin, xMax);
          const y = normalize(yValues[yi], yMin, yMax);
          const z = normalize(
            zLookup.get(`${xValues[xi]},${yValues[yi]}`) || zMin,
            zMin,
            zMax
          );

          // Store original data point
          dataPoints.push({
            position: [x, z, y],
            originalValues: {
              [columns.x]: xValues[xi],
              [columns.y]: yValues[yi],
              [columns.z]: zLookup.get(`${xValues[xi]},${yValues[yi]}`) || 0
            }
          });

          // Add vertex
          vertices.push(x, z, y);

          // Generate color based on height (z value)
          const colorScale = (z + 5) / 10; // Normalize to 0-1 range
          if (colorScheme === 'default') {
            // Blue gradient
            colors.push(
              0.2 + colorScale * 0.3, // R
              0.3 + colorScale * 0.4, // G
              0.8 + colorScale * 0.2  // B
            );
          } else {
            // Custom color scheme
            const color = new Color(colorScheme);
            color.multiplyScalar(colorScale);
            colors.push(color.r, color.g, color.b);
          }

          // UV coordinates for texturing
          uvs.push(xi / (xValues.length - 1), yi / (yValues.length - 1));
        }
      }

      // Generate faces (triangles)
      for (let yi = 0; yi < yValues.length - 1; yi++) {
        for (let xi = 0; xi < xValues.length - 1; xi++) {
          const current = yi * xValues.length + xi;
          const next = current + 1;
          const bottom = (yi + 1) * xValues.length + xi;
          const bottomNext = bottom + 1;

          // Create two triangles for each grid cell
          indices.push(
            current, next, bottom,    // First triangle
            next, bottomNext, bottom  // Second triangle
          );
        }
      }

      // Calculate normals
      for (let i = 0; i < vertices.length / 3; i++) {
        normals.push(0, 1, 0);
      }

      // Return axis information for labels
      const axisRanges = {
        x: { min: xMin, max: xMax, label: columns.x },
        y: { min: yMin, max: yMax, label: columns.y },
        z: { min: zMin, max: zMax, label: columns.z }
      };

      return {
        vertices: new Float32Array(vertices),
        indices: new Uint32Array(indices),
        colors: new Float32Array(colors),
        normals: new Float32Array(normals),
        uvs: new Float32Array(uvs),
        dataPoints,
        axisRanges
      };
    } catch (error) {
      console.error('Error generating surface geometry:', error);
      return null;
    }
  }, [data, columns, colorScheme]);

  // Axis Labels component
  const AxisLabels = React.memo(({ ranges }) => (
    <group>
      {/* X-axis label */}
      <Html position={[5, -5.5, -5]}>
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap'
        }}>
          {ranges.x.label}: {ranges.x.min.toFixed(2)} to {ranges.x.max.toFixed(2)}
        </div>
      </Html>
      {/* Y-axis label */}
      <Html position={[-5.5, 5, -5]}>
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap'
        }}>
          {ranges.y.label}: {ranges.y.min.toFixed(2)} to {ranges.y.max.toFixed(2)}
        </div>
      </Html>
      {/* Z-axis label */}
      <Html position={[-5.5, -5.5, 5]}>
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap'
        }}>
          {ranges.z.label}: {ranges.z.min.toFixed(2)} to {ranges.z.max.toFixed(2)}
        </div>
      </Html>
    </group>
  ));

  // Value tooltip
  const Tooltip = React.memo(({ point }) => (
    <Html position={point.position}>
      <div style={{
        background: 'white',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      }}>
        {Object.entries(point.originalValues).map(([key, value]) => (
          <div key={key}>
            {key}: {typeof value === 'number' ? value.toFixed(2) : value}
          </div>
        ))}
      </div>
    </Html>
  ));

  if (!geometryData) return null;

  return (
    <group>
      {/* Main surface mesh */}
      <mesh
        onPointerMove={(e) => {
          if (e.face) {
            // Find nearest data point to show tooltip
            const pointIndex = Math.floor(e.faceIndex / 2);
            setHoveredCell(geometryData.dataPoints[pointIndex]);
          }
        }}
        onPointerOut={() => setHoveredCell(null)}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={geometryData.vertices.length / 3}
            array={geometryData.vertices}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-normal"
            count={geometryData.normals.length / 3}
            array={geometryData.normals}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={geometryData.colors.length / 3}
            array={geometryData.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-uv"
            count={geometryData.uvs.length / 2}
            array={geometryData.uvs}
            itemSize={2}
          />
          <bufferAttribute
            attach="index"
            count={geometryData.indices.length}
            array={geometryData.indices}
            itemSize={1}
          />
        </bufferGeometry>
        <meshStandardMaterial
          vertexColors
          wireframe={wireframe}
          side={DoubleSide}
          metalness={0.2}
          roughness={0.8}
          flatShading={false}
        />
      </mesh>

      {/* Grid lines */}
      <gridHelper args={[10, 10, '#444444', '#222222']} position={[0, -5, 0]} />
      <gridHelper 
        args={[10, 10, '#444444', '#222222']} 
        position={[0, 0, -5]} 
        rotation={[Math.PI / 2, 0, 0]} 
      />
      <gridHelper 
        args={[10, 10, '#444444', '#222222']} 
        position={[-5, 0, 0]} 
        rotation={[0, 0, Math.PI / 2]} 
      />

      {/* Axis labels */}
      <AxisLabels ranges={geometryData.axisRanges} />

      {/* Tooltip */}
      {hoveredCell && <Tooltip point={hoveredCell} />}
    </group>
  );
};

export default SurfacePlot3D; 