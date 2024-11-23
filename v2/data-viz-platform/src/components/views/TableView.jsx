// src/components/views/TableView.jsx
import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import DataTable from '../table/DataTable';

const TableView = ({ data, analysis }) => {
  // Calculate additional statistics for the data overview
  const statistics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const stats = {
      totalRows: data.length,
      columns: Object.keys(data[0]),
      columnTypes: {},
      nullCounts: {},
      uniqueValues: {},
    };

    // Calculate statistics for each column
    stats.columns.forEach(column => {
      const values = data.map(row => row[column]);
      
      // Determine column type
      const firstValue = values.find(v => v !== null && v !== undefined);
      if (typeof firstValue === 'number') {
        stats.columnTypes[column] = 'number';
      } else if (!isNaN(Date.parse(firstValue))) {
        stats.columnTypes[column] = 'date';
      } else {
        stats.columnTypes[column] = 'string';
      }

      // Count null/empty values
      stats.nullCounts[column] = values.filter(v => 
        v === null || v === undefined || v === ''
      ).length;

      // Count unique values
      stats.uniqueValues[column] = new Set(values).size;
    });

    return stats;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No data available</Typography>
        <Typography variant="body2" color="text.secondary">
          Please upload data to view the table
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Data Overview Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Rows
                </Typography>
                <Typography variant="h4">
                  {statistics?.totalRows.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Columns
                </Typography>
                <Typography variant="h4">
                  {statistics?.columns.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="h6">
                  {new Date().toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Column Details */}
        <Typography variant="subtitle1" gutterBottom>
          Column Details
        </Typography>
        <Grid container spacing={2}>
          {statistics?.columns.map(column => (
            <Grid item xs={12} sm={6} md={4} key={column}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2">
                    {column}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {statistics.columnTypes[column]}
                    <br />
                    Unique Values: {statistics.uniqueValues[column]}
                    <br />
                    Empty Values: {statistics.nullCounts[column]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Data Table */}
      <DataTable 
        data={data} 
        title="Data Table"
      />
    </Box>
  );
};

export default TableView;