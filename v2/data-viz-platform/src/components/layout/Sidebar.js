// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Upload as UploadIcon,
  BarChart as ChartIcon,
  ViewInAr as ThreeDIcon,
  TableChart as TableIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const Sidebar = ({ currentView, onViewChange, dataLoaded, mobileOpen, setMobileOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    {
      id: 'upload',
      label: 'Upload',
      icon: UploadIcon,
      disabled: false
    },
    {
      id: 'd2',
      label: '2D Charts',
      icon: ChartIcon,
      disabled: !dataLoaded
    },
    {
      id: 'd3',
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

  

  const drawer = (
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
                className={item.id}

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
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          
          onClick={handleDrawerToggle}
          sx={{ ml: 1, mt: 11 }}
          style={{display:"flex", alignItems:'flex-start' , position: "fixed", backgroundcolor: "rgba(229, 229, 229,0.6)", zIndex:10,borderRadius: "20%", borderColor:"#14213d", borderWidth:"1px", borderStyle:"solid"}}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={isMobile ? handleDrawerToggle : undefined}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          width: isMobile ? 'auto' : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? 'auto' : DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            justifyContent: 'flex-start',
            display: 'flex',
            top: "100px"
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar;