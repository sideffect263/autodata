
// src/components/upload/datasource/CloudStorage.jsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent
} from '@mui/material';

const CloudStorage = () => {
  const cloudConfigs = [
    { id: 'gdrive', name: 'Google Drive', icon: '📁' },
    { id: 'dropbox', name: 'Dropbox', icon: '📦' },
    { id: 'onedrive', name: 'OneDrive', icon: '☁️' },
    { id: 's3', name: 'Amazon S3', icon: '🗄️' },
  ];

  const handleCloudServiceSelect = (service) => {
    // This would typically integrate with the service's SDK/API
    console.log(`Selected cloud service: ${service.name}`);
    alert(`${service.name} integration coming soon`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Cloud Storage Services
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: 2 
      }}>
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
};

export default CloudStorage;