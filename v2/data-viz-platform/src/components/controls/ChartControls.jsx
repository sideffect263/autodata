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
  FormControlLabel
} from '@mui/material';

const ChartControls = ({ 
  type = 'bar', 
  columns = [], 
  selected = { x: '', y: '', group: '' }, 
  onChange 
}) => {
  if (!columns || columns.length === 0) return null;

  const handleChange = (field) => (event) => {
    onChange({
      ...selected,
      [field]: event.target.value || ''  // Ensure empty string instead of undefined
    });
  };

  const handleSwitchChange = (field) => (event) => {
    onChange({
      ...selected,
      [field]: event.target.checked
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
              value={selected.x || ''}
              label="X Axis"
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

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Y Axis</InputLabel>
            <Select
              value={selected.y || ''}
              label="Y Axis"
              onChange={handleChange('y')}
            >
              <MenuItem value="">None</MenuItem>
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
                value={selected.group || ''}
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

          {/* Chart-specific controls */}
          {type === 'bar' && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!selected.stacked}  // Convert to boolean
                    onChange={handleSwitchChange('stacked')}
                  />
                }
                label="Stacked Bars"
              />
            </Box>
          )}

          {type === 'line' && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!selected.smooth}  // Convert to boolean
                    onChange={handleSwitchChange('smooth')}
                  />
                }
                label="Smooth Lines"
              />
            </Box>
          )}

          {type === 'scatter' && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!selected.showTrendline}  // Convert to boolean
                    onChange={handleSwitchChange('showTrendline')}
                  />
                }
                label="Show Trendline"
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartControls;