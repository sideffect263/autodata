// src/components/controls/ChartControls.jsx
import React from 'react';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';

const ChartControls = ({ 
  type = 'bar', 
  columns = [], 
  selected = { x: '', y: '', group: '' }, 
  onChange,
  analysis 
}) => {


  if (!columns || columns.length === 0) return null;


  const handleChange = (field) => (event) => {
    const newValue = event.target.value;
    const updatedColumns = {
      ...selected,
      [field]: newValue
    };

    // Handle special cases for different chart types
    if (type === 'pie' && field === 'x') {
      updatedColumns.y = 'count'; // Set default count for pie charts
    }

    // Clear group when changing main axes
    if (['x', 'y'].includes(field) && !newValue) {
      updatedColumns.group = '';
    }

    onChange(updatedColumns);
  };

  const handleSwitchChange = (field) => (event) => {
    onChange({
      ...selected,
      [field]: event.target.checked
    });
  };

  const renderAxisControl = (axis, label) => (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={selected[axis] || ''}
        label={label}
        onChange={handleChange(axis)}
      >
        <MenuItem value="">None</MenuItem>
        {axis === 'y' && type !== 'pie' && (
          <MenuItem value="count">Count</MenuItem>
        )}
        {columns.map(column => (
          <MenuItem key={column} value={column}>
            {column}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const renderChartSpecificControls = () => {
    switch (type) {
      case 'bar':
        return (
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(selected.stacked)}
                  onChange={handleSwitchChange('stacked')}
                  disabled={!selected.group}
                />
              }
              label="Stacked Bars"
            />
          </Box>
        );
      
      case 'line':
        return (
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(selected.smooth)}
                  onChange={handleSwitchChange('smooth')}
                />
              }
              label="Smooth Lines"
            />
          </Box>
        );

      case 'scatter':
        return (
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(selected.showTrendline)}
                  onChange={handleSwitchChange('showTrendline')}
                />
              }
              label="Show Trendline"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card       className="ChartControls"
    sx={{ width: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Chart Controls
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          {/* X Axis / Dimension */}
          {renderAxisControl('x', type === 'pie' ? 'Dimension' : 'X Axis')}

          {/* Y Axis / Value - Only show for non-pie charts */}
          {type !== 'pie' && renderAxisControl('y', 'Y Axis')}

          {/* Group By - Not for pie charts */}
          {type !== 'pie' && (
            <>
              <Divider sx={{ my: 2 }} />
              <FormControl fullWidth sx={{ mb: 2 }}>
    <InputLabel>Dimension</InputLabel>
    <Select
      value={selected.x || ''}
      label="Dimension"
      onChange={handleChange('x')}
    >
      <MenuItem value="">None</MenuItem>
      {columns.map(column => (
        <MenuItem key={column} value={column}>
          {column}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
            </>
          )}

          {/* Chart-specific controls */}
          {(selected.x && (type === 'pie' || selected.y)) && (
            <>
              <Divider sx={{ my: 2 }} />
              {renderChartSpecificControls()}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartControls;