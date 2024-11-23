
// src/components/visualizations/3d/SurfacePlot3D.jsx
import React, { useMemo } from 'react';
import { DoubleSide, Color } from 'three';

const SurfacePlot3D = ({ data, columns, colorScale, wireframe = false, resolution = 50 }) => {
  const { x: xColumn, y: yColumn, z: zColumn, color: colorColumn } = columns;

  const geometry = useMemo(() => {
    if (!data || !xColumn || !yColumn || !zColumn) return null;

    // Extract unique x and y values
    const xValues = [...new Set(data.map(d => d[xColumn]))].sort((a, b) => a - b);
    const yValues = [...new Set(data.map(d => d[yColumn]))].sort((a, b) => a - b);

    // Create grid of z values
    const zGrid = new Array(yValues.length).fill(0).map(() => 
      new Array(xValues.length).fill(0)
    );

    // Fill z values
    data.forEach(point => {
      const xIndex = xValues.indexOf(point[xColumn]);
      const yIndex = yValues.indexOf(point[yColumn]);
      if (xIndex !== -1 && yIndex !== -1) {
        zGrid[yIndex][xIndex] = point[zColumn];
      }
    });

    // Calculate ranges for normalization
    const zMin = Math.min(...data.map(d => d[zColumn]));
    const zMax = Math.max(...data.map(d => d[zColumn]));

    // Generate vertices and faces
    const vertices = [];
    const indices = [];
    const colors = [];
    const uvs = [];

    // Create vertices grid
    for (let i = 0; i < yValues.length; i++) {
      for (let j = 0; j < xValues.length; j++) {
        const x = (j / (xValues.length - 1) * 10) - 5;
        const y = (i / (yValues.length - 1) * 10) - 5;
        const z = ((zGrid[i][j] - zMin) / (zMax - zMin) * 10) - 5;

        vertices.push(x, z, y); // Note: y and z swapped for better visualization
        const color = colorScale ? colorScale((zGrid[i][j] - zMin) / (zMax - zMin)) : '#1976d2';
        colors.push(...new Color(color).toArray());
        uvs.push(j / (xValues.length - 1), i / (yValues.length - 1));
      }
    }

    // Create faces (triangles)
    for (let i = 0; i < yValues.length - 1; i++) {
      for (let j = 0; j < xValues.length - 1; j++) {
        const a = i * xValues.length + j;
        const b = a + 1;
        const c = (i + 1) * xValues.length + j;
        const d = c + 1;

        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint32Array(indices),
      colors: new Float32Array(colors),
      uvs: new Float32Array(uvs)
    };
  }, [data, xColumn, yColumn, zColumn, colorScale]);

  if (!geometry) return null;

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={geometry.vertices.length / 3}
          array={geometry.vertices}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={geometry.colors.length / 3}
          array={geometry.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-uv"
          count={geometry.uvs.length / 2}
          array={geometry.uvs}
          itemSize={2}
        />
        <bufferAttribute
          attach="index"
          count={geometry.indices.length}
          array={geometry.indices}
          itemSize={1}
        />
      </bufferGeometry>
      <meshPhongMaterial
        vertexColors
        wireframe={wireframe}
        side={DoubleSide}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

export default SurfacePlot3D;
