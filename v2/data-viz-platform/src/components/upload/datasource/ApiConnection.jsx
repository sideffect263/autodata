
// src/components/upload/datasource/ApiConnection.jsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import { useData } from '../../../contexts/DataContext';

const ApiConnection = () => {
  const { processData } = useData();
  const [error, setError] = useState(null);
  const [apiConfigs, setApiConfigs] = useState(() => {
    const saved = localStorage.getItem('savedApiConfigs');
    return saved ? JSON.parse(saved) : [];
  });

  const [apiConfigDialogOpen, setApiConfigDialogOpen] = useState(false);
  const [selectedApiConfig, setSelectedApiConfig] = useState(null);
  const [newApiConfig, setNewApiConfig] = useState({
    name: '',
    url: '',
    method: 'GET',
    headers: {},
    body: '',
    dataPath: '',
    autoRefresh: false,
    refreshInterval: 60,
  });

  const handleApiConfigSave = () => {
    if (!newApiConfig.name || !newApiConfig.url) {
      setError('Name and URL are required');
      return;
    }

    try {
      const updatedConfigs = selectedApiConfig
        ? apiConfigs.map(config => 
            config === selectedApiConfig ? newApiConfig : config
          )
        : [...apiConfigs, newApiConfig];

      setApiConfigs(updatedConfigs);
      localStorage.setItem('savedApiConfigs', JSON.stringify(updatedConfigs));
      handleDialogClose();
    } catch (err) {
      setError('Failed to save API configuration');
    }
  };

  const handleDialogClose = () => {
    setApiConfigDialogOpen(false);
    setNewApiConfig({
      name: '',
      url: '',
      method: 'GET',
      headers: {},
      body: '',
      dataPath: '',
      autoRefresh: false,
      refreshInterval: 60,
    });
    setSelectedApiConfig(null);
  };

  const handleApiFetch = async (config) => {
    try {
      setError(null);
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.method !== 'GET' ? config.body : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      if (config.dataPath) {
        const paths = config.dataPath.split('.');
        for (const path of paths) {
          data = data[path];
        }
      }

      await processData(data);

      if (config.autoRefresh) {
        const intervalId = setInterval(() => {
          handleApiFetch(config);
        }, config.refreshInterval * 1000);
        
        return () => clearInterval(intervalId);
      }
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
    }
  };

  const handleDeleteConfig = (indexToDelete) => {
    const updated = apiConfigs.filter((_, index) => index !== indexToDelete);
    setApiConfigs(updated);
    localStorage.setItem('savedApiConfigs', JSON.stringify(updated));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          API Connections
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setApiConfigDialogOpen(true)}
        >
          Add New
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {apiConfigs.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No API connections configured yet
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {apiConfigs.map((config, index) => (
            <Card key={index} variant="outlined">
              <CardContent sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                '&:last-child': { pb: 2 }
              }}>
                <Box>
                  <Typography variant="subtitle1">
                    {config.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {config.url}
                  </Typography>
                </Box>
                <Box>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedApiConfig(config);
                        setNewApiConfig(config);
                        setApiConfigDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Connect">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleApiFetch(config)}
                    >
                      <ApiIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteConfig(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={apiConfigDialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedApiConfig ? 'Edit API Connection' : 'New API Connection'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={newApiConfig.name}
              onChange={(e) => setNewApiConfig(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label="URL"
              fullWidth
              value={newApiConfig.url}
              onChange={(e) => setNewApiConfig(prev => ({ ...prev, url: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Method</InputLabel>
              <Select
                value={newApiConfig.method}
                label="Method"
                onChange={(e) => setNewApiConfig(prev => ({ ...prev, method: e.target.value }))}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>

            {newApiConfig.method !== 'GET' && (
              <TextField
                label="Request Body"
                fullWidth
                multiline
                rows={4}
                value={newApiConfig.body}
                onChange={(e) => setNewApiConfig(prev => ({ ...prev, body: e.target.value }))}
              />
            )}

            <TextField
              label="Headers (JSON)"
              fullWidth
              multiline
              rows={2}
              value={JSON.stringify(newApiConfig.headers, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value);
                  setNewApiConfig(prev => ({ ...prev, headers }));
                  setError(null);
                } catch {
                  setError('Invalid JSON format for headers');
                }
              }}
            />

            <TextField
              label="Data Path (e.g., response.data.items)"
              fullWidth
              value={newApiConfig.dataPath}
              onChange={(e) => setNewApiConfig(prev => ({ 
                ...prev, 
                dataPath: e.target.value 
              }))}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newApiConfig.autoRefresh}
                  onChange={(e) => setNewApiConfig(prev => ({ 
                    ...prev, 
                    autoRefresh: e.target.checked 
                  }))}
                />
              }
              label="Auto Refresh"
            />

            {newApiConfig.autoRefresh && (
              <TextField
                label="Refresh Interval (seconds)"
                type="number"
                value={newApiConfig.refreshInterval}
                onChange={(e) => setNewApiConfig(prev => ({ 
                  ...prev, 
                  refreshInterval: parseInt(e.target.value) || 60
                }))}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleApiConfigSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiConnection;
