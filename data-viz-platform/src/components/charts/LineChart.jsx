
// src/components/charts/LineChart.jsx
import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const LineChart = ({ data, columns }) => {
  const { x, y, group } = columns;
  
  if (!x || !y) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={y} stroke="#8884d8" />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;