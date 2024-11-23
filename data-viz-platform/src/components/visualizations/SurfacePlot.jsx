// src/components/visualizations/SurfacePlot.jsx
import React, { useMemo } from 'react';
import { DoubleSide } from 'three';

const SurfacePlot = ({ data, xColumn, yColumn, zColumn, resolution = 50, color = '#1976d2' }) => {
  const surfaceGeometry = useMemo(() => {
    if (!data || !xColumn || !yColumn || !zColumn) return null;

    // Get unique x and y values
    const xValues = [...new Set(data.map(d => d[xColumn]))].sort((a, b) => a - b);
    const yValues = [...new Set(data.map(d => d[yColumn]))].sort((a, b) => a - b);

    // Create a grid of z values
    const zGrid = new Array(yValues.length).fill(0).map(() => 
      new Array(xValues.length).fill(0)
    );

    // Fill the grid with z values
    data.forEach(point => {
      const xIndex = xValues.indexOf(point[xColumn]);
      const yIndex = yValues.indexOf(point[yColumn]);
      if (xIndex !== -1 && yIndex !== -1) {
        zGrid[yIndex][xIndex] = point[zColumn];
      }
    });

    // Normalize values
    const xScale = 10 / xValues.length;
    const yScale = 10 / yValues.length;
    const zMin = Math.min(...data.map(d => d[zColumn]));
    const zMax = Math.max(...data.map(d => d[zColumn]));
    const zScale = 10 / (zMax - zMin);

    // Generate vertices and faces
    const vertices = [];
    const indices = [];
    const uvs = [];

    // Create vertices
    for (let y = 0; y < yValues.length; y++) {
      for (let x = 0; x < xValues.length; x++) {
        vertices.push(
          (x - xValues.length / 2) * xScale,
          (zGrid[y][x] - zMin) * zScale - 5,
          (y - yValues.length / 2) * yScale
        );
        uvs.push(x / (xValues.length - 1), y / (yValues.length - 1));
      }
    }

    // Create faces
    for (let y = 0; y < yValues.length - 1; y++) {
      for (let x = 0; x < xValues.length - 1; x++) {
        const v0 = y * xValues.length + x;
        const v1 = v0 + 1;
        const v2 = (y + 1) * xValues.length + x;
        const v3 = v2 + 1;

        // Create two triangles for each grid cell
        indices.push(v0, v1, v2); // First triangle
        indices.push(v2, v1, v3); // Second triangle
      }
    }

    return { vertices, indices, uvs };
  }, [data, xColumn, yColumn, zColumn]);

  if (!surfaceGeometry) return null;

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={surfaceGeometry.vertices.length / 3}
          array={new Float32Array(surfaceGeometry.vertices)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-uv"
          count={surfaceGeometry.uvs.length / 2}
          array={new Float32Array(surfaceGeometry.uvs)}
          itemSize={2}
        />
        <bufferAttribute
          attach="index"
          array={new Uint16Array(surfaceGeometry.indices)}
          count={surfaceGeometry.indices.length}
          itemSize={1}
        />
      </bufferGeometry>
      <meshPhongMaterial 
        color={color}
        side={DoubleSide}
        shininess={60}
        wireframe={false}
      />
    </mesh>
  );
};

export default SurfacePlot;