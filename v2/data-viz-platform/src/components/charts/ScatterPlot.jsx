// src/components/charts/ScatterPlot.jsx
import React, { useMemo } from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const COLORS = ['#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600'];

const ScatterPlot = ({ data, columns, analysis }) => {
  const { x, y, group, showTrendline } = columns;

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!data || !x || !y) return [];

    try {
      if (group) {
        const groupedData = data.reduce((acc, item) => {
          const groupValue = item[group];
          if (!acc[groupValue]) {
            acc[groupValue] = [];
          }

          const xValue = Number(item[x]);
          const yValue = Number(item[y]);

          if (!isNaN(xValue) && !isNaN(yValue)) {
            acc[groupValue].push({
              x: xValue,
              y: yValue,
              name: item[group],
            });
          }
          return acc;
        }, {});

        return Object.entries(groupedData).map(([key, points]) => ({
          name: key,
          data: points,
        }));
      }

      return data
        .map((item) => ({
          x: Number(item[x]),
          y: Number(item[y]),
          name: `${x} vs ${y}`,
        }))
        .filter((point) => !isNaN(point.x) && !isNaN(point.y));
    } catch (error) {
      console.error('Error processing data for ScatterPlot:', error);
      return [];
    }
  }, [data, x, y, group]);

  const trendlineData = useMemo(() => {
    if (!showTrendline || !processedData.length) return null;

    try {
      const points = group ? processedData[0].data : processedData;
      const n = points.length;

      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0;

      points.forEach((point) => {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
      });

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));

      return [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept },
      ];
    } catch (error) {
      console.error('Error calculating trendline:', error);
      return null;
    }
  }, [processedData, showTrendline, group]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {group && (
          <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
            {`${group}: ${data.name}`}
          </p>
        )}
        <p style={{ margin: 0, color: '#555' }}>{`${x}: ${data.x}`}</p>
        <p style={{ margin: 0, color: '#555' }}>{`${y}: ${data.y}`}</p>
      </div>
    );
  };

  if (!data || !x || !y || processedData.length === 0) {
    return <p>No data available for visualization.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={"100%"}>
      <RechartsScatterChart
        margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
        <XAxis
          dataKey="x"
          type="number"
          name={x}
          tick={{ fill: '#444' }}
          axisLine={{ stroke: '#aaa' }}
          label={{ value: x, position: 'bottom', offset: 0 }}
        />
        <YAxis
          dataKey="y"
          type="number"
          name={y}
          tick={{ fill: '#444' }}
          axisLine={{ stroke: '#aaa' }}
          label={{ value: y, angle: -90, position: 'left', offset: 0 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign='left' />
        {group
          ? processedData.map((series, index) => (
              <Scatter
                key={series.name}
                name={series.name}
                data={series.data}
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={1}
              />
            ))
          : processedData.length > 0 && (
              <Scatter
                name={`${x} vs ${y}`}
                data={processedData}
                fill={COLORS[0]}
                stroke="#fff"
                strokeWidth={1}
              />
            )}
        {showTrendline && trendlineData && (
          <ReferenceLine
            segment={trendlineData}
            stroke="#ff7300"
            strokeDasharray="5 5"
            label={{
              value: 'Trend Line',
              position: 'insideTopRight',
            }}
          />
        )}
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
};

export default ScatterPlot;
