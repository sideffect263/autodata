import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  LinearProgress,
  Collapse,
} from '@mui/material';
import {
  Lightbulb,
  TrendingUp,
  Info,
  ExpandMore,
  ExpandLess,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { useThreeD } from './context/ThreeDContext';

const SuggestionCard = ({ suggestion, isActive, onClick }) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <Card
      elevation={isActive ? 3 : 1}
      sx={{
        minWidth: 300,
        maxWidth: 300,
        cursor: 'pointer',
        bgcolor: isActive ? 'action.selected' : 'background.paper',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
        transition: 'all 0.2s ease-in-out',
        height: expanded ? 'auto' : '140px',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {suggestion.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
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

        <Typography variant="body2" color="text.secondary" sx={{ 
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {suggestion.description}
        </Typography>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1 }}>
            {suggestion.insights?.map((insight, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <TrendingUp fontSize="small" color="primary" />
                <Typography variant="caption" color="text.secondary">
                  {insight.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
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

  const scrollContainerRef = React.useRef(null);

  const threeDSuggestions = suggestions.filter(suggestion => 
    suggestion.visualization?.dimensions === 3
  );

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Card width + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Lightbulb color="primary" sx={{ mr: 1 }} fontSize="small" />
          <Typography variant="subtitle2">Analyzing Data...</Typography>
        </Box>
        <LinearProgress />
      </Paper>
    );
  }

  if (error) {
    return null;
  }

  if (!threeDSuggestions?.length) {
    return null;
  }

  return (
    <Paper sx={{ p: 1, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Lightbulb color="primary" sx={{ mr: 1 }} fontSize="small" />
          <Typography variant="subtitle2">
            Auto Visualization Suggestions
          </Typography>
          <Tooltip title="Suggestions are based on data patterns and best visualization practices">
            <Info color="action" sx={{ ml: 1 }} fontSize="small" />
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleScroll('left')}>
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton size="small" onClick={() => handleScroll('right')}>
            <KeyboardArrowRight />
          </IconButton>
        </Box>
      </Box>

      <Box
        ref={scrollContainerRef}
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollBehavior: 'smooth'
        }}
      >
        {threeDSuggestions.map((suggestion, index) => (
          <SuggestionCard
            key={index}
            suggestion={suggestion}
            isActive={activeSuggestion?.id === suggestion.id}
            onClick={() => handleSuggestionClick(suggestion)}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default Suggestions;