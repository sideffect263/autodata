// src/services/brain/analyzers/patternDetector.js
import { calculateCorrelation, detectTrend, detectSeasonality } from '../utils/statisticalUtils';

/**
 * PatternDetector Class
 * Responsible for detecting various patterns in data including:
 * - Statistical correlations between numeric columns
 * - Time series patterns and seasonality
 * - Data distributions and anomalies
 * - Categorical relationships
 */
export class PatternDetector {
  constructor() {
    // Initialize settings
    this.settings = {
      correlationThreshold: 0.3,
      seasonalityThreshold: 0.3,
      clusterMinSize: 3,
      outlierThreshold: 2, // Standard deviations
      maxPatterns: 100 // Limit total patterns for performance
    };

    // Initialize pattern storage
    this.clearPatterns();
  }

  /**
   * Clear all detected patterns
   */
  clearPatterns() {
    this.patterns = {
      correlations: [],
      timeSeries: [],
      distributions: [],
      outliers: [],
      categories: [],
      metadata: {
        lastUpdated: null,
        dataSize: 0,
        processedColumns: []
      }
    };
  }

  /**
   * Initialize the detector with options
   */
  async initialize(options = {}) {
    this.settings = {
      ...this.settings,
      ...options
    };
  }

  /**
   * Main analysis entry point
   */
  async analyzePatterns(data, columns) {
    if (!data || !columns || data.length === 0) {
      throw new Error('Invalid data or columns provided to PatternDetector');
    }

    try {
      this.clearPatterns();

      // Update metadata
      this.patterns.metadata = {
        lastUpdated: new Date().toISOString(),
        dataSize: data.length,
        processedColumns: Object.keys(columns)
      };

      // Run all pattern detection algorithms
      const [
        correlations,
        timeSeriesPatterns,
        distributions,
        outliers,
        categories
      ] = await Promise.all([
        this.detectCorrelations(data, columns),
        this.detectTimeSeriesPatterns(data, columns),
        this.detectDistributions(data, columns),
        this.detectOutliers(data, columns),
        this.detectCategoryPatterns(data, columns)
      ]);

      // Update patterns object
      this.patterns = {
        ...this.patterns,
        correlations,
        timeSeries: timeSeriesPatterns,
        distributions,
        outliers,
        categories
      };

      return this.patterns;

    } catch (error) {
      console.error('Pattern detection failed:', error);
      throw error;
    }
  }

  /**
   * Detect correlations between numeric columns
   */
  async detectCorrelations(data, columns) {
    const correlations = [];
    const numericColumns = this.getNumericColumns(columns);

    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        try {
          const col1 = numericColumns[i];
          const col2 = numericColumns[j];

          // Filter out rows where either value is NaN
          const filteredData = data.filter(row => 
            !isNaN(row[col1]) && !isNaN(row[col2])
          );
          const values1 = filteredData.map(row => row[col1]);
          const values2 = filteredData.map(row => row[col2]);

          if (values1.length === 0 || values2.length === 0) continue;

          const coefficient = await calculateCorrelation(values1, values2);

          if (Math.abs(coefficient) >= this.settings.correlationThreshold) {
            correlations.push({
              columns: [col1, col2],
              coefficient,
              strength: this.categorizeCorrelationStrength(coefficient),
              significance: this.calculateSignificance(coefficient, values1.length),
              metadata: {
                sampleSize: values1.length,
                timestamp: new Date().toISOString()
              }
            });
          }
        } catch (error) {
          console.warn(`Correlation detection failed for columns: ${numericColumns[i]}, ${numericColumns[j]}`, error);
        }
      }
    }

    return correlations;
  }

  /**
   * Detect time series patterns
   */
  async detectTimeSeriesPatterns(data, columns) {
    const patterns = [];
    const dateColumns = this.getDateColumns(columns);
    const numericColumns = this.getNumericColumns(columns);

    for (const dateCol of dateColumns) {
      for (const valueCol of numericColumns) {
        try {
          const timeSeriesData = this.prepareTimeSeriesData(data, dateCol, valueCol);
          if (!timeSeriesData.valid) continue;

          const trend = detectTrend(timeSeriesData.values);
          const seasonality = detectSeasonality(timeSeriesData.values, timeSeriesData.dates);

          if (trend.strength > this.settings.seasonalityThreshold || 
              (seasonality && seasonality.strength > this.settings.seasonalityThreshold)) {
            
            patterns.push({
              dateColumn: dateCol,
              valueColumn: valueCol,
              trend,
              seasonality,
              confidence: Math.max(trend.strength, seasonality?.strength || 0),
              insights: this.generateTimeSeriesInsights(trend, seasonality),
              metadata: {
                dataPoints: timeSeriesData.values.length,
                dateRange: {
                  start: timeSeriesData.dates[0],
                  end: timeSeriesData.dates[timeSeriesData.dates.length - 1]
                }
              }
            });
          }
        } catch (error) {
          console.warn(`Time series detection failed for columns: ${dateCol}, ${valueCol}`, error);
        }
      }
    }

    return patterns;
  }

  /**
   * Detect distribution patterns and anomalies
   */
  async detectDistributions(data, columns) {
    const distributions = [];
    const numericColumns = this.getNumericColumns(columns);

    for (const column of numericColumns) {
      try {
        const values = data.map(row => row[column]).filter(val => !isNaN(val));
        if (values.length === 0) continue;

        const stats = this.calculateDistributionStats(values);
        const distributionType = this.determineDistributionType(stats);

        distributions.push({
          column,
          type: distributionType,
          stats,
          insights: this.generateDistributionInsights(stats, distributionType),
          metadata: {
            sampleSize: values.length,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn(`Distribution detection failed for column: ${column}`, error);
      }
    }

    return distributions;
  }

  /**
   * Detect outliers in numeric columns
   */
  async detectOutliers(data, columns) {
    const outliers = [];
    const numericColumns = this.getNumericColumns(columns);

    for (const column of numericColumns) {
      try {
        const values = data.map(row => row[column]).filter(val => !isNaN(val));
        if (values.length === 0) continue;

        const { mean, stdDev } = this.calculateBasicStats(values);
        const threshold = this.settings.outlierThreshold * stdDev;

        const columnOutliers = values.map((value, index) => ({
          value,
          index,
          deviation: Math.abs(value - mean)
        })).filter(item => item.deviation > threshold);

        if (columnOutliers.length > 0) {
          outliers.push({
            column,
            outliers: columnOutliers,
            stats: { mean, stdDev, threshold },
            metadata: {
              totalPoints: values.length,
              outlierCount: columnOutliers.length,
              outlierPercentage: (columnOutliers.length / values.length) * 100
            }
          });
        }
      } catch (error) {
        console.warn(`Outlier detection failed for column: ${column}`, error);
      }
    }

    return outliers;
  }

  /**
   * Detect patterns in categorical data
   */
  async detectCategoryPatterns(data, columns) {
    const patterns = [];
    const categoricalColumns = this.getCategoricalColumns(columns);

    for (const column of categoricalColumns) {
      try {
        const categories = this.analyzeCategoryDistribution(data, column);
        const insights = this.generateCategoryInsights(categories);

        patterns.push({
          column,
          categories,
          insights,
          metadata: {
            uniqueValues: categories.length,
            totalCount: data.length,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn(`Category pattern detection failed for column: ${column}`, error);
      }
    }

    return patterns;
  }

  // Utility Methods

  /**
   * Get columns of specific types
   */
  getNumericColumns(columns) {
    return Object.entries(columns)
      .filter(([_, info]) => info.type === 'numeric')
      .map(([name]) => name);
  }

  getDateColumns(columns) {
    return Object.entries(columns)
      .filter(([_, info]) => info.type === 'date')
      .map(([name]) => name);
  }

  getCategoricalColumns(columns) {
    return Object.entries(columns)
      .filter(([_, info]) => info.type === 'categorical')
      .map(([name]) => name);
  }

  /**
   * Correlation strength categorization
   */
  categorizeCorrelationStrength(coefficient) {
    const absCoeff = Math.abs(coefficient);
    if (absCoeff >= 0.8) return 'very strong';
    if (absCoeff >= 0.6) return 'strong';
    if (absCoeff >= 0.4) return 'moderate';
    if (absCoeff >= 0.2) return 'weak';
    return 'very weak';
  }

  /**
   * Calculate statistical significance
   */
  calculateSignificance(correlation, sampleSize) {
    const tStat = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    return {
      tStatistic: tStat,
      significant: Math.abs(tStat) > 1.96 // 95% confidence level
    };
  }

  /**
   * Generate insights for time series
   */
  generateTimeSeriesInsights(trend, seasonality) {
    const insights = [];

    if (trend.strength > 0.5) {
      insights.push({
        type: 'trend',
        description: `Strong ${trend.type} trend detected with slope ${trend.slope.toFixed(3)}`,
        confidence: trend.strength
      });
    }

    if (seasonality && seasonality.strength > 0.5) {
      insights.push({
        type: 'seasonality',
        description: `Seasonal pattern detected with period of ${seasonality.period} units`,
        confidence: seasonality.strength
      });
    }

    return insights;
  }

  /**
   * Prepare time series data
   */
  prepareTimeSeriesData(data, dateColumn, valueColumn) {
    const pairs = data
      .map(row => ({
        date: new Date(row[dateColumn]),
        value: parseFloat(row[valueColumn])
      }))
      .filter(pair => !isNaN(pair.date) && !isNaN(pair.value))
      .sort((a, b) => a.date - b.date);

    return {
      valid: pairs.length >= 3,
      dates: pairs.map(p => p.date),
      values: pairs.map(p => p.value)
    };
  }

  /**
   * Calculate distribution statistics
   */
  calculateDistributionStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const { mean, stdDev } = this.calculateBasicStats(values);

    return {
      mean,
      stdDev,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      q1: sorted[Math.floor(sorted.length / 4)],
      q3: sorted[Math.floor(3 * sorted.length / 4)],
      skewness: this.calculateSkewness(values, mean, stdDev),
      kurtosis: this.calculateKurtosis(values, mean, stdDev)
    };
  }

  /**
   * Calculate basic statistics
   */
  calculateBasicStats(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev, variance };
  }

  /**
   * Determine distribution type
   */
  determineDistributionType(stats) {
    if (Math.abs(stats.skewness) < 0.5 && Math.abs(stats.kurtosis) < 0.5) {
      return 'normal';
    }
    if (stats.skewness > 1) {
      return 'right-skewed';
    }
    if (stats.skewness < -1) {
      return 'left-skewed';
    }
    return 'unknown';
  }

  /**
   * Generate insights for distributions
   */
  generateDistributionInsights(stats, type) {
    const insights = [];

    insights.push({
      type: 'distribution',
      description: `Distribution appears to be ${type}`,
      confidence: 0.8
    });

    if (Math.abs(stats.skewness) > 1) {
      insights.push({
        type: 'skewness',
        description: `Significant ${stats.skewness > 0 ? 'positive' : 'negative'} skewness detected`,
        confidence: Math.min(Math.abs(stats.skewness) / 2, 1)
      });
    }

    return insights;
  }

  /**
   * Analyze category distribution
   */
  analyzeCategoryDistribution(data, column) {
    const counts = {};
    data.forEach(row => {
      const value = row[column];
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / data.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Generate category insights
   */
// Continuing the generateCategoryInsights method and adding remaining functionality...

generateCategoryInsights(categories) {
  const insights = [];
  const totalCategories = categories.length;
  const dominantCategory = categories[0];
  const smallestCategory = categories[categories.length - 1];

  if (totalCategories > 0) {
    // Check for dominant category
    if (dominantCategory.percentage > 50) {
      insights.push({
        type: 'dominant',
        description: `Dominant category "${dominantCategory.category}" represents ${dominantCategory.percentage.toFixed(1)}% of data`,
        confidence: dominantCategory.percentage / 100
      });
    }

    // Check for imbalanced distribution
    const ratio = dominantCategory.count / smallestCategory.count;
    if (ratio > 10) {
      insights.push({
        type: 'imbalance',
        description: `Significant category imbalance detected (${ratio.toFixed(1)}:1 ratio)`,
        confidence: Math.min(ratio / 20, 1),
        ratio
      });
    }

    // Check for rare categories
    const rareCategories = categories.filter(cat => cat.percentage < 5);
    if (rareCategories.length > 0) {
      insights.push({
        type: 'rare',
        description: `Found ${rareCategories.length} rare categories (< 5% each)`,
        confidence: 0.8,
        details: {
          categories: rareCategories.map(c => c.category),
          totalPercentage: rareCategories.reduce((sum, cat) => sum + cat.percentage, 0)
        }
      });
    }

    // Check for uniform distribution
    const expectedPercentage = 100 / totalCategories;
    const deviations = categories.map(cat => 
      Math.abs(cat.percentage - expectedPercentage)
    );
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    
    if (avgDeviation < 10) {
      insights.push({
        type: 'uniform',
        description: 'Categories are relatively uniformly distributed',
        confidence: 1 - (avgDeviation / 10)
      });
    }
  }

  return insights;
}

/**
 * Additional statistical calculations
 */
calculateSkewness(values, mean, stdDev) {
  const n = values.length;
  if (n === 0 || stdDev === 0) return 0;
  
  const cube = values.reduce((sum, val) => 
    sum + Math.pow((val - mean) / stdDev, 3)
  , 0);
  
  return (n / ((n - 1) * (n - 2))) * cube;
}

calculateKurtosis(values, mean, stdDev) {
  const n = values.length;
  if (n === 0 || stdDev === 0) return 0;
  
  const fourth = values.reduce((sum, val) => 
    sum + Math.pow((val - mean) / stdDev, 4)
  , 0);
  
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * fourth - 
         (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}

/**
 * Advanced pattern detection methods
 */
async detectTrendPatterns(data, timeColumn, valueColumns) {
  const trends = [];
  
  for (const valueCol of valueColumns) {
    const values = data.map(row => row[valueCol]);
    const times = data.map(row => new Date(row[timeColumn]).getTime());
    
    // Linear regression
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += times[i];
      sumY += values[i];
      sumXY += times[i] * values[i];
      sumX2 += times[i] * times[i];
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    let ssTot = 0, ssRes = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * times[i] + intercept;
      ssTot += Math.pow(values[i] - yMean, 2);
      ssRes += Math.pow(values[i] - predicted, 2);
    }
    
    const rSquared = Math.max(0, Math.min(1, 1 - (ssRes / ssTot)));
    
    trends.push({
      column: valueCol,
      slope,
      intercept,
      rSquared,
      type: slope > 0 ? 'increasing' : 'decreasing',
      strength: Math.sqrt(rSquared),
      metadata: {
        timeRange: {
          start: new Date(Math.min(...times)),
          end: new Date(Math.max(...times))
        }
      }
    });
  }
  
  return trends;
}

async detectClusters(data, numericColumns, options = {}) {
  const clusters = [];
  const minPoints = options.minPoints || this.settings.clusterMinSize;
  
  // Simple clustering based on density
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      
      const points = data.map(row => ({
        x: row[col1],
        y: row[col2]
      })).filter(p => !isNaN(p.x) && !isNaN(p.y));
      
      // Find dense regions
      const eps = options.eps || this.calculateOptimalEps(points);
      const denseClusters = this.dbscan(points, eps, minPoints);
      
      if (denseClusters.length > 1) {
        clusters.push({
          columns: [col1, col2],
          clusters: denseClusters,
          confidence: this.calculateClusterConfidence(denseClusters, points.length),
          metadata: {
            totalPoints: points.length,
            numClusters: denseClusters.length
          }
        });
      }
    }
  }
  
  return clusters;
}

calculateOptimalEps(points) {
  // Calculate average distance to k nearest neighbors
  const k = Math.max(3, Math.floor(Math.sqrt(points.length) / 2));
  const distances = [];
  
  for (const p1 of points) {
    const pointDistances = points
      .map(p2 => Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
      ))
      .sort((a, b) => a - b)
      .slice(1, k + 1);
    
    distances.push(pointDistances.reduce((a, b) => a + b, 0) / k);
  }
  
  return distances.reduce((a, b) => a + b, 0) / distances.length;
}

dbscan(points, eps, minPts) {
  const clusters = [];
  const visited = new Set();
  
  for (const point of points) {
    if (visited.has(point)) continue;
    visited.add(point);
    
    const neighbors = this.getNeighbors(point, points, eps);
    if (neighbors.length < minPts) continue;
    
    const cluster = [point];
    clusters.push(cluster);
    
    let i = 0;
    while (i < neighbors.length) {
      const neighbor = neighbors[i];
      
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const newNeighbors = this.getNeighbors(neighbor, points, eps);
        if (newNeighbors.length >= minPts) {
          neighbors.push(...newNeighbors);
        }
      }
      
      if (!cluster.includes(neighbor)) {
        cluster.push(neighbor);
      }
      
      i++;
    }
  }
  
  return clusters;
}

getNeighbors(point, points, eps) {
  return points.filter(p => 
    p !== point && 
    Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)) <= eps
  );
}

calculateClusterConfidence(clusters, totalPoints) {
  const clusterSizes = clusters.map(c => c.length);
  const coverage = clusterSizes.reduce((a, b) => a + b, 0) / totalPoints;
  const balance = 1 - (Math.max(...clusterSizes) - Math.min(...clusterSizes)) / totalPoints;
  
  return (coverage * 0.7 + balance * 0.3);
}
}

// Create and export singleton instance
export const patternDetector = new PatternDetector();
export default patternDetector;