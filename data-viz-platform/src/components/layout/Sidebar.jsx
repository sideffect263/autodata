// src/components/layout/Sidebar.jsx
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Upload as UploadIcon,
  BarChart as ChartIcon,
  ViewInAr as ThreeDIcon,
  TableChart as TableIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const Sidebar = ({ currentView, onViewChange, dataLoaded }) => {
  const menuItems = [
    {
      id: 'upload',
      label: 'Upload',
      icon: UploadIcon,
      disabled: false
    },
    {
      id: '2d',
      label: '2D Charts',
      icon: ChartIcon,
      disabled: !dataLoaded
    },
    {
      id: '3d',
      label: '3D Visualizations',
      icon: ThreeDIcon,
      disabled: !dataLoaded
    },
    {
      id: 'table',
      label: 'Table View',
      icon: TableIcon,
      disabled: !dataLoaded
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      disabled: false
    }
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider'
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <Tooltip 
                title={item.disabled ? 'Load data first' : item.label}
                placement="right"
              >
                <ListItemButton
                  selected={currentView === item.id}
                  onClick={() => !item.disabled && onViewChange(item.id)}
                  disabled={item.disabled}
                >
                  <ListItemIcon>
                    <item.icon 
                      color={currentView === item.id ? 'primary' : 'inherit'}
                    />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;