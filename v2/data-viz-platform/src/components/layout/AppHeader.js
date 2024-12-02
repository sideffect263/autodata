import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { GitHub as GitHubIcon, HelpOutline as HelpIcon } from '@mui/icons-material';

const AppHeader = ({ onHelpClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(to right, #3f51b5, #2196f3)',
        py: isMobile ? 0.5 : 1,
      }}
    >
      <Toolbar sx={{ justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Data Visualization Platform
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" size="large" onClick={onHelpClick}>
            <HelpIcon />
          </IconButton>
          <IconButton
            color="inherit"
            size="large"
            onClick={() => window.open('https://github.com/sideffect263/autodata', '_blank')}
          >
            <GitHubIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
