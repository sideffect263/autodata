// src/components/views/ThreeDView/Suggestions.jsx
import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import { styles } from './utils';

export const Suggestions = ({ suggestions, activeSuggestion, onSuggestionClick }) => {
  if (!suggestions.length) return null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Lightbulb color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Suggested Visualizations
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {suggestions.map((suggestion, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              variant="outlined"
              sx={{
                ...styles.suggestionCard,
                bgcolor: activeSuggestion === suggestion ? 'action.selected' : 'background.paper',
              }}
              onClick={() => onSuggestionClick(suggestion)}
            >
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {suggestion.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {suggestion.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};