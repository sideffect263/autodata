// src/components/charts/LineChart.jsx
import React, { useMemo } from 'react';
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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

const LineChart = ({ data, columns }) => {
  const { x, y, group } = columns;
  
  if (!x || !y) return null;

  // Process data for grouping
  const processedData = useMemo(() => {
    if (!group) return data;

    // Get unique values for group column
    const groupValues = [...new Set(data.map(item => item[group]))];
    
    // Get unique values for x-axis
    const xValues = [...new Set(data.map(item => item[x]))].sort();

    // Create grouped data structure
    return xValues.map(xValue => {
      const entry = { [x]: xValue };
      
      // Add value for each group
      groupValues.forEach(groupValue => {
        const groupData = data.filter(item => 
          item[x] === xValue && 
          item[group] === groupValue
        );
        
        entry[groupValue] = groupData.reduce((sum, item) => sum + item[y], 0);
      });

      return entry;
    });
  }, [data, x, y, group]);

  // Get unique group values for creating lines
  const groupValues = group ? [...new Set(data.map(item => item[group]))] : [y];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsLineChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} />
        <YAxis />
        <Tooltip />
        <Legend />
        
        {/* Render a line for each group */}
        {groupValues.map((groupValue, index) => (
          <Line
            key={groupValue}
            type="monotone"
            dataKey={group ? groupValue : y}
            name={group ? `${groupValue}` : y}
            stroke={COLORS[index % COLORS.length]}
            dot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;