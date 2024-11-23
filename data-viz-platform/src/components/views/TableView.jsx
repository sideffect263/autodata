// src/components/views/TableView.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import DataTable from '../table/DataTable';

const TableView = ({ data, analysis }) => {
  return (
    <Box>
      {analysis && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dataset Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Rows: {analysis.rowCount} • 
            Columns: {analysis.columns.length} •
            Last Updated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      )}
      
      <DataTable data={data} />
    </Box>
  );
};

export default TableView;