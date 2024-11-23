import React, { useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

const BarChart = ({ data, columns }) => {
  const { x, y, group } = columns;

  // Process data for grouping
  const processedData = useMemo(() => {
    if (!x || !y) return [];

    if (!group) return data;

    // Get unique values for the group column
    const groupValues = [...new Set(data.map(item => item[group]))];
    
    // Get unique values for x-axis
    const xValues = [...new Set(data.map(item => item[x]))];

    // Create grouped data structure
    return xValues.map(xValue => {
      const entry = { [x]: xValue };
      
      // Add value for each group
      groupValues.forEach(groupValue => {
        const groupData = data.filter(item => 
          item[x] === xValue && 
          item[group] === groupValue
        );
        
        // Calculate sum or count for the group
        entry[groupValue] = groupData.reduce((sum, item) => sum + item[y], 0);
      });

      return entry;
    });
  }, [data, x, y, group]);

  // Get unique group values for creating bars
  const groupValues = group ? [...new Set(data.map(item => item[group]))] : [y];

  if (!x || !y) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsBarChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} />
        <YAxis />
        <Tooltip />
        <Legend />
        
        {/* Render a bar for each group */}
        {groupValues.map((groupValue, index) => (
          <Bar 
            key={groupValue}
            dataKey={group ? groupValue : y}
            name={group ? `${groupValue}` : y}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;