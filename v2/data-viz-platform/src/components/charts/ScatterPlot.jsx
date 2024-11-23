// src/components/charts/ScatterPlot.jsx
import React from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ScatterPlot = ({ data, columns }) => {
  const { x, y, group } = columns;
  
  if (!x || !y) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} type="number" name={x} />
        <YAxis dataKey={y} type="number" name={y} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name={`${x} vs ${y}`} data={data} fill="#8884d8" />
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
};

export default ScatterPlot;