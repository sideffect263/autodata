import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Api as ApiIcon,
  CloudQueue as CloudIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import DropZone from './DropZone';

const DataSourceSelector = ({ onDataSourceSelect,onDataProcessed }) => {
  // Source type state
  const [sourceType, setSourceType] = useState('local');
  
  // API configuration state
  const [apiConfigs, setApiConfigs] = useState(() => {
    const saved = localStorage.getItem('savedApiConfigs');
    return saved ? JSON.parse(saved) : [];
  });
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
  const [apiConfigDialogOpen, setApiConfigDialogOpen] = useState(false);
  const [selectedApiConfig, setSelectedApiConfig] = useState(null);

  // Cloud service state
  const [cloudConfigs] = useState([
    { id: 'gdrive', name: 'Google Drive', icon: '📁' },
    { id: 'dropbox', name: 'Dropbox', icon: '📦' },
    { id: 'onedrive', name: 'OneDrive', icon: '☁️' },
    { id: 's3', name: 'Amazon S3', icon: '🗄️' },
  ]);
  
  // Error handling state
  const [error, setError] = useState(null);

  // Handle source type change
  const handleSourceTypeChange = (_, newValue) => {
    setSourceType(newValue);
    setError(null);
  };

  // Handle API configuration
  const handleApiConfigSave = () => {
    if (!newApiConfig.name || !newApiConfig.url) {
      setError('Name and URL are required');
      return;
    }

    try {
      const updatedConfigs = [...apiConfigs, newApiConfig];
      setApiConfigs(updatedConfigs);
      localStorage.setItem('savedApiConfigs', JSON.stringify(updatedConfigs));
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
    } catch (err) {
      setError('Failed to save API configuration');
    }
  };

  // Handle API data fetch
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

      // Navigate to specific data path if specified
      if (config.dataPath) {
        const paths = config.dataPath.split('.');
        for (const path of paths) {
          data = data[path];
        }
      }

      onDataSourceSelect({
        type: 'api',
        data,
        config,
      });
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
    }
  };

  // Handle cloud service selection
  const handleCloudServiceSelect = (service) => {
    // This would typically integrate with the service's SDK/API
    console.log(`Selected cloud service: ${service.name}`);
    // For demonstration, show that integration is pending
    setError(`${service.name} integration coming soon`);
  };

  // Render different content based on source type
  const renderContent = () => {
    switch (sourceType) {
      case 'local':
        return (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            
            <input
              type="file"
              accept=".csv,.json,.xlsx"
              style={{ display: 'none' }}
              id="file-upload"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  onDataSourceSelect({
                    type: 'local',
                    file,
                  });
                }
              }}
            />
            <label htmlFor="file-upload">
            <DropZone onDataProcessed={onDataProcessed} />

            </label>

          </Box>
        );

      case 'api':
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
                            onClick={() => {
                              const updated = apiConfigs.filter((_, i) => i !== index);
                              setApiConfigs(updated);
                              localStorage.setItem('savedApiConfigs', JSON.stringify(updated));
                            }}
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
          </Box>
        );

      case 'cloud':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cloud Storage Services
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
              {cloudConfigs.map((service) => (
                <Card
                  key={service.id}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => handleCloudServiceSelect(service)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ mb: 1 }}>
                      {service.icon}
                    </Typography>
                    <Typography variant="subtitle1">
                      {service.name}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Tabs
        value={sourceType}
        onChange={handleSourceTypeChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab 
          icon={<UploadIcon />} 
          label="Local File" 
          value="local"
          iconPosition="start"
        />
        <Tab 
          icon={<ApiIcon />} 
          label="API" 
          value="api"
          iconPosition="start"
        />
        <Tab 
          icon={<CloudIcon />} 
          label="Cloud Storage" 
          value="cloud"
          iconPosition="start"
        />
      </Tabs>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {renderContent()}

      {/* API Configuration Dialog */}
      <Dialog
        open={apiConfigDialogOpen}
        onClose={() => {
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
        }}
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
              onChange={(e) => setNewApiConfig(prev => ({ ...prev, dataPath: e.target.value }))}
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
          <Button 
            onClick={() => {
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
            }}
          >
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

export default DataSourceSelector;