// src/components/charts/PieChart.jsx
import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const PieChart = ({ data, columns }) => {
  const { x, y } = columns;
  
  if (!x || !y) return null;

  const processedData = data.reduce((acc, item) => {
    const key = item[x];
    const value = item[y];
    const existingItem = acc.find(i => i[x] === key);
    
    if (existingItem) {
      existingItem[y] += value;
    } else {
      acc.push({ [x]: key, [y]: value });
    }
    return acc;
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsPieChart>
        <Pie
          data={processedData}
          dataKey={y}
          nameKey={x}
          cx="50%"
          cy="50%"
          outerRadius={150}
          label
        >
          {processedData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChart;