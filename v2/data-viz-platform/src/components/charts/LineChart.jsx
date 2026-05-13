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

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c',
  '#ffa07a', '#20b2aa', '#b0c4de', '#dda0dd', '#f0e68c'
];

const LineChart = ({ data, columns, analysis }) => {
  const { x, y, group, smooth } = columns;

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

        const sortedEntries = Object.entries(counts)
          .sort(([a], [b]) => a.localeCompare(b));

        return sortedEntries.map(([xValue, count]) => ({
          [x]: xValue,
          count: count
        }));
      }

      // Handle grouped data
      if (group) {
        const groupValues = [...new Set(data.map(item => item[group]))];
        const xValues = [...new Set(data.map(item => item[x]))].sort();

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

      // Simple data transformation with sorting
      return [...data]
        .sort((a, b) => String(a[x]).localeCompare(String(b[x])))
        .map(item => ({
          [x]: item[x],
          [y]: Number(item[y]) || 0
        }));

    } catch (error) {
      console.error('Error processing data for LineChart:', error);
      return [];
    }
  }, [data, x, y, group]);

  // Get values for line creation
  const lineValues = useMemo(() => {
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

  // Custom dot configuration
  const customDot = {
    r: 4,
    strokeWidth: 2,
    stroke: '#102b3f'
  };

  // Custom active dot configuration
  const customActiveDot = {
    r: 6,
    strokeWidth: 2,
    stroke: '#fff'
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsLineChart 
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
        
        {lineValues.map((lineValue, index) => (
          <Line
            key={lineValue}
            type={smooth ? "natural" : "linear"}
            dataKey={lineValue}
            name={lineValue}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={customDot}
            activeDot={customActiveDot}
            connectNulls={true}
            animationDuration={300}
            isAnimationActive={true}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;