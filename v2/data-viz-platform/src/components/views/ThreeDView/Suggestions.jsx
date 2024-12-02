// src/components/views/ThreeDView/components/Suggestions.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Lightbulb,
  ViewIn3d,
  TrendingUp,
  Info,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useThreeD } from './context/ThreeDContext';

const SuggestionCard = ({ suggestion, isActive, onClick }) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  console.log(suggestion);

  return (
    <Card
      elevation={isActive ? 3 : 1}
      sx={{
        cursor: 'pointer',
        bgcolor: isActive ? 'action.selected' : 'background.paper',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1">
                {suggestion.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                size="small"
                label={`${Math.round(suggestion.score * 100)}%`}
                color={suggestion.score > 0.7 ? 'success' : 'default'}
              />
              <IconButton
                size="small"
                onClick={handleExpand}
                sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary">
            {suggestion.description}
          </Typography>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              {/* Visualization details */}
              <Typography variant="subtitle2" gutterBottom>
                Configuration:
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(suggestion.visualization.config).map(([key, value]) => (
                  <Grid item xs={6} key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {key}: {value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Insights */}
              {suggestion.insights?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Insights:
                  </Typography>
                  {suggestion.insights.map((insight, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <TrendingUp fontSize="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">
                        {insight.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const Suggestions = () => {
  const {
    suggestions,
    activeSuggestion,
    handleSuggestionClick,
    isLoading,
    error
  } = useThreeD();

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Lightbulb color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Analyzing Data...
          </Typography>
        </Box>
        <LinearProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Info color="error" sx={{ mr: 1 }} />
          <Typography color="error.contrastText">
            Error generating suggestions: {error}
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!suggestions?.length) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Lightbulb color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Auto Visualization Suggestions
        </Typography>
        <Tooltip title="Suggestions are based on data patterns and best visualization practices">
          <Info color="action" sx={{ ml: 1 }} />
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        {suggestions.map((suggestion, index) => (
          <Grid item xs={12} md={4} key={index}>
            <SuggestionCard
              suggestion={suggestion}
              isActive={activeSuggestion?.id === suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default Suggestions;