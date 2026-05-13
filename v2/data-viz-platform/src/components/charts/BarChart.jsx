// src/components/charts/BarChart.jsx
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

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c',
  '#ffa07a', '#20b2aa', '#b0c4de', '#dda0dd', '#f0e68c'
];

const BarChart = ({ data, columns, analysis }) => {
  const { x, y, group, stacked } = columns;

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!data || !x || !y) return [];

    try {
      // Handle count aggregation
      if (y === 'count') {
        const counts = data.reduce((acc, item) => {
          const xValue = item[x];
          acc[xValue] = (acc[xValue] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(counts).map(([xValue, count]) => ({
          [x]: xValue,
          count: count
        }));
      }

      // Handle grouped data
      if (group) {
        // Get unique values
        const groupValues = [...new Set(data.map(item => item[group]))];
        const xValues = [...new Set(data.map(item => item[x]))];

        // Create grouped structure
        return xValues.map(xValue => {
          const entry = { [x]: xValue };
          
          groupValues.forEach(groupValue => {
            const groupData = data.filter(item => 
              item[x] === xValue && 
              item[group] === groupValue
            );
            
            entry[groupValue] = groupData.reduce((sum, item) => {
              const value = Number(item[y]);
              return sum + (isNaN(value) ? 0 : value);
            }, 0);
          });

          return entry;
        });
      }

      // Simple data transformation
      return data.map(item => ({
        [x]: item[x],
        [y]: Number(item[y]) || 0
      }));

    } catch (error) {
      console.error('Error processing data for BarChart:', error);
      return [];
    }
  }, [data, x, y, group]);

  // Get values for bar creation
  const barValues = useMemo(() => {
    if (!data || !x) return [];
    if (y === 'count') return ['count'];
    if (group) return [...new Set(data.map(item => item[group]))];
    return [y];
  }, [data, x, y, group]);

  // Validate required props
  if (!data || !x || !y || processedData.length === 0) {
    return null;
  }

  // Format tooltip value
  const formatTooltipValue = (value) => {
    if (typeof value !== 'number') return value;
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <p style={{ margin: '0 0 5px' }}><strong>{label}</strong></p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '0', color: entry.color }}>
            {entry.name}: {formatTooltipValue(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsBarChart 
        data={processedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false}
        />
        <XAxis 
          dataKey={x}
          tick={{ fill: '#666' }}
          tickLine={{ stroke: '#666' }}
          axisLine={{ stroke: '#666' }}
        />
        <YAxis 
          tick={{ fill: '#666' }}
          tickLine={{ stroke: '#666' }}
          axisLine={{ stroke: '#666' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
        />
        
        {barValues.map((barValue, index) => (
          <Bar 
            key={barValue}
            dataKey={barValue}
            name={barValue}
            fill={COLORS[index % COLORS.length]}
            stackId={stacked ? 'stack' : undefined}
            radius={[4, 4, 0, 0]} // Rounded corners
            maxBarSize={50} // Limit bar width
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;