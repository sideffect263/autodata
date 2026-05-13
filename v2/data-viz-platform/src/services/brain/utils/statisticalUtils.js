// src/services/brain/utils/statisticalUtils.js

/**
 * Calculate correlation coefficient between two arrays
 */
export const calculateCorrelation = (values1, values2) => {
  if (values1.length !== values2.length) {
    throw new Error('Arrays must have the same length');
  }

  const n = values1.length;
  const mean1 = values1.reduce((a, b) => a + b, 0) / n;
  const mean2 = values2.reduce((a, b) => a + b, 0) / n;
  
  let num = 0;
  let den1 = 0;
  let den2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    num += diff1 * diff2;
    den1 += diff1 * diff1;
    den2 += diff2 * diff2;
  }
  
  if (den1 === 0 || den2 === 0) return 0;
  return num / Math.sqrt(den1 * den2);
};

/**
 * Detect trend in time series data
 */
export const detectTrend = (values) => {
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared for trend strength
  const yMean = sumY / n;
  let ssTot = 0, ssRes = 0;
  
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssTot += Math.pow(values[i] - yMean, 2);
    ssRes += Math.pow(values[i] - predicted, 2);
  }
  
  const rSquared = Math.max(0, Math.min(1, 1 - (ssRes / ssTot)));
  
  return {
    type: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
    slope,
    intercept,
    strength: Math.sqrt(rSquared)
  };
};

/**
 * Detect seasonality in time series data
 */
export const detectSeasonality = (values, dates) => {
  if (values.length < 4) return null;
  
  // Calculate differences between consecutive values
  const differences = [];
  for (let i = 1; i < values.length; i++) {
    differences.push(values[i] - values[i - 1]);
  }
  
  // Count sign changes (turning points)
  let turningPoints = 0;
  for (let i = 1; i < differences.length; i++) {
    if ((differences[i] > 0 && differences[i - 1] < 0) ||
        (differences[i] < 0 && differences[i - 1] > 0)) {
      turningPoints++;
    }
  }
  
  // Estimate period length
  const estimatedPeriod = Math.round(values.length / (turningPoints + 1));
  
  // Calculate strength based on autocorrelation
  const correlations = [];
  for (let lag = 1; lag <= Math.min(estimatedPeriod * 2, Math.floor(values.length / 2)); lag++) {
    const series1 = values.slice(0, -lag);
    const series2 = values.slice(lag);
    correlations.push(calculateCorrelation(series1, series2));
  }
  
  // Find highest correlation at potential seasonal lags
  const maxCorrelation = Math.max(...correlations);
  
  return {
    exists: maxCorrelation > 0.3,
    period: estimatedPeriod,
    strength: maxCorrelation
  };
};

// Export all statistical utilities
export default {
  calculateCorrelation,
  detectTrend,
  detectSeasonality
};