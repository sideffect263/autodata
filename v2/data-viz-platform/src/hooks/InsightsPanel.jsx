// src/components/insights/InsightsPanel.jsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import InsightsList from './InsightsList';
import SuggestionsList from './SuggestionsList';
import { useAnalysis } from '../../hooks/useAnalysis';

const InsightsPanel = ({ data, onSuggestionSelect }) => {
  const { insights, suggestions, analysisComplete } = useAnalysis(data);

  if (!data) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Upload data to see insights and suggestions
      </Alert>
    );
  }

  if (!analysisComplete) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Analyzing your data...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ height: '100%', overflow: 'hidden' }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Insights Section */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Data Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Key findings from your data analysis
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex' }}>
          <Box sx={{ width: '100%', display: 'flex' }}>
            {/* Main Content Area */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <InsightsList insights={insights} />
              <Divider sx={{ my: 2 }} />
              <SuggestionsList 
                suggestions={suggestions} 
                onSelect={onSuggestionSelect} 
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default InsightsPanel;

// src/components/insights/InsightsList.jsx
import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  PieChart,
  Timeline,
  InsertChart,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

const InsightsList = ({ insights }) => {
  const [expandedId, setExpandedId] = useState(null);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'numeric':
        return <TrendingUp color="primary" />;
      case 'categorical':
        return <PieChart color="secondary" />;
      case 'date':
        return <Timeline color="info" />;
      default:
        return <InsertChart />;
    }
  };

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getImportanceColor = (importance) => {
    if (importance >= 80) return 'error';
    if (importance >= 60) return 'warning';
    if (importance >= 40) return 'info';
    return 'default';
  };

  return (
    <List component="div" disablePadding>
      {insights.map((insight, index) => (
        <React.Fragment key={index}>
          <ListItemButton onClick={() => handleExpand(index)}>
            <ListItemIcon>
              {getInsightIcon(insight.type)}
            </ListItemIcon>
            <ListItemText
              primary={insight.title}
              secondary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                >
                  {insight.description}
                </Typography>
              }
            />
            {insight.importance && (
              <Chip
                size="small"
                label={`${insight.importance}%`}
                color={getImportanceColor(insight.importance)}
                sx={{ mr: 1 }}
              />
            )}
            {expandedId === index ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={expandedId === index} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, pl: 9, bgcolor: 'action.hover' }}>
              <Typography color="text.secondary" paragraph>
                {insight.description}
              </Typography>
              {insight.details && (
                <Typography variant="body2" color="text.secondary">
                  {insight.details}
                </Typography>
              )}
              {insight.recommendations?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {insight.recommendations.map((rec, idx) => (
                      <Chip
                        key={idx}
                        label={rec}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
};

export default InsightsList;

// src/components/insights/SuggestionsList.jsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Grid,
} from '@mui/material';
import {
  Lightbulb,
  BarChart,
  ShowChart,
  BubbleChart,
  PieChart,
} from '@mui/icons-material';

const SuggestionsList = ({ suggestions, onSelect }) => {
  const getVisualizationIcon = (type) => {
    switch (type) {
      case 'bar':
        return <BarChart />;
      case 'line':
        return <ShowChart />;
      case 'scatter':
        return <BubbleChart />;
      case 'pie':
        return <PieChart />;
      default:
        return <BarChart />;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Lightbulb color="primary" sx={{ mr: 1 }} />
        Suggested Visualizations
      </Typography>

      <Grid container spacing={2}>
        {suggestions.map((suggestion, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card 
              variant="outlined"
              sx={{
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                }
              }}
            >
              <CardActionArea onClick={() => onSelect(suggestion)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getVisualizationIcon(suggestion.visualization?.type)}
                    <Typography variant="subtitle1" sx={{ ml: 1 }}>
                      {suggestion.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {suggestion.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`Score: ${suggestion.score}%`}
                      color={suggestion.score >= 80 ? 'primary' : 'default'}
                    />
                    <Chip
                      size="small"
                      label={suggestion.visualization?.type}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SuggestionsList;