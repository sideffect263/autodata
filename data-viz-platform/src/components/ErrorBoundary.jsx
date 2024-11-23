import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Alert,
  AlertTitle 
} from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to your error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Attempt recovery by clearing data if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            p: 3
          }}
        >
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              maxWidth: 500,
              width: '100%'
            }}
          >
            <Alert 
              severity="error"
              icon={<ErrorOutline fontSize="large" />}
              sx={{ mb: 2 }}
            >
              <AlertTitle>Something went wrong</AlertTitle>
              {this.props.fallbackMessage || 'An error occurred while rendering this component'}
            </Alert>

            {this.state.error && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mb: 2,
                  backgroundColor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  fontFamily: 'monospace'
                }}
              >
                {this.state.error.toString()}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button
                variant="contained"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;