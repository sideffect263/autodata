// src/components/layout/AppHeader.jsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';

const AppHeader = () => {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Data Visualization Platform
        </Typography>
        <Box>
          <IconButton color="inherit" size="large">
            <HelpIcon />
          </IconButton>
          <IconButton 
            color="inherit"
            size="large"
            onClick={() => window.open('https://github.com/yourusername/project', '_blank')}
          >
            <GitHubIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;