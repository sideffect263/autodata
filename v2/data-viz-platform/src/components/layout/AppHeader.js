import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  HelpOutline as HelpIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const AppHeader = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(to right, #3f51b5, #2196f3)',
        py: isMobile ? 0.5 : 1, // Adjust padding for mobile
      }}
    >
      <Toolbar sx={{ justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Data Visualization Platform
          </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" size="large">
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
