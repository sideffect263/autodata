// src/components/charts/PieChart.jsx
import React, { useMemo } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#ff7c43', '#665191', '#a05195'
];

const RADIAN = Math.PI / 180;

const PieChart = ({ data, columns }) => {

  const dimension = columns.dimension;
  const value = columns.value;
  // Process data for visualization
  const processedData = useMemo(() => {

    if (!data || !dimension) return [];

    try {

      // Count occurrences if no value specified
      if (!value || value === 'count') {

        const counts = data.reduce((acc, item) => {
          const key = item[dimension];
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(counts).map(([key, count]) => ({
          name: key,
          value: count
        }));
      }

      // Sum values for each dimension
      const aggregated = data.reduce((acc, item) => {
        const key = item[dimension];
        const val = Number(item[value]) || 0;
        acc[key] = (acc[key] || 0) + val;
        return acc;
      }, {});

      return Object.entries(aggregated)
        .map(([key, sum]) => ({
          name: key,
          value: sum
        }))
        .filter(item => item.value > 0) // Remove zero values
        .sort((a, b) => b.value - a.value); // Sort by value descending

    } catch (error) {
      console.error('Error processing data for PieChart:', error);
      return [];
    }
  }, [data, dimension, value]);

  // Calculate total for percentages
  const total = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.value, 0);
  }, [processedData]);

  // Validate data
  if (!data || !dimension || processedData.length === 0) {
    return null;
  }

  // Custom label renderer
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if segment is large enough
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{
          fontSize: '12px',
          fontWeight: '500',
          textShadow: '0px 0px 2px rgba(0,0,0,0.5)'
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    const percentage = ((data.value / total) * 100).toFixed(1);

    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{data.name}</p>
        <p style={{ margin: '0', color: payload[0].color }}>
          {value === 'count' ? 'Count' : value}: {data.value.toLocaleString()}
        </p>
        <p style={{ margin: '0', color: payload[0].color }}>
          Percentage: {percentage}%
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsPieChart>
        <Pie
          data={processedData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={140}
          labelLine={false}
          label={renderCustomizedLabel}
          paddingAngle={2}
        >
          {processedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]}
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
          <Label
            value={value === 'count' ? 'Distribution' : value}
            position="center"
            style={{
              fontSize: '16px',
              fill: '#666',
              fontWeight: 500
            }}
          />
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{
            paddingLeft: '10px'
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChart;