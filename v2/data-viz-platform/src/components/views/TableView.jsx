import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import DataTable from '../table/DataTable';

const TableView = ({ data, analysis }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    stats.columns.forEach((column) => {
      const values = data.map((row) => row[column]);

      // Determine column type
      const firstValue = values.find((v) => v !== null && v !== undefined);
      if (typeof firstValue === 'number') {
        stats.columnTypes[column] = 'number';
      } else if (!isNaN(Date.parse(firstValue))) {
        stats.columnTypes[column] = 'date';
      } else {
        stats.columnTypes[column] = 'string';
      }

      // Count null/empty values
      stats.nullCounts[column] = values.filter(
        (v) => v === null || v === undefined || v === ''
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
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            background: 'linear-gradient(to right, #2196f3, #21cbf3)',
            color: 'white',
            py: 1,
            px: 2,
            borderRadius: 1,
          }}
        >
          Data Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, '&:hover': { boxShadow: 6 } }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Rows
                </Typography>
                <Typography variant="h5">
                  {statistics?.totalRows.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, '&:hover': { boxShadow: 6 } }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Columns
                </Typography>
                <Typography variant="h5">
                  {statistics?.columns.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, '&:hover': { boxShadow: 6 } }}>
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
        <Grid container spacing={isMobile ? 1 : 2}>
          {statistics?.columns.map((column) => (
            <Grid item xs={12} sm={6} md={isMobile ? 6 : 4} key={column}>
              <Tooltip title={column} arrow>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    '&:hover': { boxShadow: 4, backgroundColor: theme.palette.grey[100] },
                  }}
                >
                  <CardContent sx={{ p: isMobile ? 1 : 2 }}>
                    <Typography variant={isMobile ? 'body1' : 'subtitle2'}>
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
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Data Table */}
      <DataTable data={data} title="Data Table" isMobile={isMobile} />
    </Box>
  );
};

export default TableView;
