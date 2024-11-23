// src/components/views/TableView.jsx
import React from 'react';

import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
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
TableView.propTypes = {
  data: PropTypes.array.isRequired,
  analysis: PropTypes.shape({
    rowCount: PropTypes.number,
    columns: PropTypes.arrayOf(PropTypes.object),
  }),
};

export default TableView;