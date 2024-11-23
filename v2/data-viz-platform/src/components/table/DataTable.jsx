// src/components/table/DataTable.jsx
import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  Box,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

const DataTable = ({ data, title }) => {
  // State for table functionality
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState({});

  // Get column headers from the first data item
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Initialize selected columns if empty
  React.useEffect(() => {
    if (columns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns(columns);
    }
  }, [columns]);

  // Handle sorting
  const handleSort = (column) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  // Handle column selection
  const handleColumnToggle = (column) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  // Detect column data types
  const columnTypes = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const types = {};
    columns.forEach(column => {
      const value = data[0][column];
      if (typeof value === 'number') types[column] = 'number';
      else if (!isNaN(Date.parse(value))) types[column] = 'date';
      else types[column] = 'string';
    });
    
    return types;
  }, [data, columns]);

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data) return [];

    let filteredData = data.filter(row =>
      // Global search
      Object.entries(row).some(([key, value]) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      // Column filters
      Object.entries(filters).every(([column, filter]) => {
        if (!filter) return true;
        const value = row[column];
        if (columnTypes[column] === 'number') {
          const num = Number(value);
          return !filter.min || num >= filter.min &&
                 !filter.max || num <= filter.max;
        }
        return String(value).toLowerCase().includes(filter.toLowerCase());
      })
    );

    if (orderBy) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];

        if (columnTypes[orderBy] === 'number') {
          return order === 'asc'
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
        }

        if (columnTypes[orderBy] === 'date') {
          return order === 'asc'
            ? new Date(aValue) - new Date(bValue)
            : new Date(bValue) - new Date(aValue);
        }

        return order === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filteredData;
  }, [data, searchTerm, orderBy, order, filters, columnTypes]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export data functionality
  const handleExport = () => {
    const csvContent = [
      selectedColumns.join(','),
      ...processedData.map(row =>
        selectedColumns.map(column =>
          typeof row[column] === 'string' && row[column].includes(',')
            ? `"${row[column]}"`
            : row[column]
        ).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title || 'data'}_export.csv`;
    link.click();
  };

  // Handle filter changes
  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Table Controls */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search data..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon />
              </IconButton>
            )
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Visible Columns</InputLabel>
          <Select
            multiple
            value={selectedColumns}
            onChange={(e) => setSelectedColumns(e.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {columns.map((column) => (
              <MenuItem key={column} value={column}>
                {column}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Export data">
          <IconButton onClick={handleExport}>
            <ExportIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Table */}
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectedColumns.map((column) => (
                <TableCell
                  key={column}
                  sortDirection={orderBy === column ? order : false}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TableSortLabel
                      active={orderBy === column}
                      direction={orderBy === column ? order : 'asc'}
                      onClick={() => handleSort(column)}
                    >
                      {column}
                    </TableSortLabel>
                    <TextField
                      size="small"
                      placeholder="Filter..."
                      value={filters[column] || ''}
                      onChange={(e) => handleFilterChange(column, e.target.value)}
                      sx={{ width: 100 }}
                    />
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, rowIndex) => (
                <TableRow hover key={rowIndex}>
                  {selectedColumns.map((column) => (
                    <TableCell key={column}>
                      {columnTypes[column] === 'date'
                        ? new Date(row[column]).toLocaleDateString()
                        : row[column]?.toString() || ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={processedData.length}
        rowsPerPage={rowsPerPage}
        page={Math.min(page, Math.ceil(processedData.length / rowsPerPage) - 1)}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DataTable;