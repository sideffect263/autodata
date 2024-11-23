// src/components/controls/ChartControls.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box
} from '@mui/material';

const ChartControls = ({ type, columns, selected, onChange }) => {
  if (!columns || columns.length === 0) return null;

  const handleChange = (field) => (event) => {
    onChange({
      ...selected,
      [field]: event.target.value
    });
  };

  return (
    <Card sx={{ width: 300 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Chart Controls
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>X Axis</InputLabel>
            <Select
              value={selected.x}
              label="X Axis"
              onChange={handleChange('x')}
            >
              {columns.map(column => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Y Axis</InputLabel>
            <Select
              value={selected.y}
              label="Y Axis"
              onChange={handleChange('y')}
            >
              {columns.map(column => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {type !== 'pie' && (
            <FormControl fullWidth>
              <InputLabel>Group By</InputLabel>
              <Select
                value={selected.group}
                label="Group By"
                onChange={handleChange('group')}
              >
                <MenuItem value="">None</MenuItem>
                {columns.map(column => (
                  <MenuItem key={column} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
ChartControls.propTypes = {
  type: PropTypes.string.isRequired,
  columns: PropTypes.array.isRequired,
  selected: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ChartControls;