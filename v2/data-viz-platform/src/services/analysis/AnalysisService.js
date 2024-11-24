// src/services/analysis/AnalysisService.js

/**
 * Core service to manage data analysis and insights
 */
class AnalysisService {
    constructor() {
      this.data = null;
      this.columnTypes = null;
      this.insights = [];
      this.suggestions = [];
      this.analysisComplete = false;
      this.subscribers = new Set();
    }
  
    // Initialize with new data
    async initializeData(data) {
      this.data = data;
      this.analysisComplete = false;
      this.insights = [];
      this.suggestions = [];
      
      // Start analysis pipeline
      await this.analyzeData();
    }
  
    // Main analysis pipeline
    async analyzeData() {
      try {
        // 1. Analyze column types
        this.columnTypes = this.analyzeColumnTypes();
        
        // 2. Generate basic insights
        this.insights = this.generateBasicInsights();
        
        // 3. Generate visualization suggestions
        this.suggestions = this.generateVisualizationSuggestions();
        
        this.analysisComplete = true;
        this.notifySubscribers();
      } catch (error) {
        console.error('Analysis failed:', error);
      }
    }
  
    // Analyze and categorize columns
    analyzeColumnTypes() {
      if (!this.data || !this.data.length) return null;
  
      const columnTypes = {};
      const sample = this.data[0];
  
      for (const column of Object.keys(sample)) {
        const values = this.data.map(row => row[column]);
        
        columnTypes[column] = {
          name: column,
          type: this.detectType(values),
          uniqueValues: new Set(values).size,
          nullCount: values.filter(v => v === null || v === undefined || v === '').length,
          stats: this.getBasicStats(values)
        };
      }
  
      return columnTypes;
    }
  
    // Detect column type from values
    detectType(values) {
      const nonNullValue = values.find(v => v !== null && v !== undefined && v !== '');
      
      if (typeof nonNullValue === 'number') return 'numeric';
      if (!isNaN(Date.parse(nonNullValue))) return 'date';
      
      const uniqueCount = new Set(values).size;
      if (uniqueCount <= Math.min(10, values.length * 0.1)) return 'categorical';
      
      return 'text';
    }
  
    // Calculate basic statistics for a column
    getBasicStats(values) {
      const stats = {
        min: null,
        max: null,
        mean: null,
        distinct: new Set(values).size
      };
  
      if (typeof values[0] === 'number') {
        const numericValues = values.filter(v => typeof v === 'number');
        stats.min = Math.min(...numericValues);
        stats.max = Math.max(...numericValues);
        stats.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      }
  
      return stats;
    }
  
    // Generate basic insights about the data
    generateBasicInsights() {
      const insights = [];
  
      // Data overview insights
      insights.push({
        type: 'overview',
        importance: 100,
        title: 'Data Overview',
        description: `Dataset contains ${this.data.length} rows and ${Object.keys(this.columnTypes).length} columns.`
      });
  
      // Column-specific insights
      for (const [columnName, columnInfo] of Object.entries(this.columnTypes)) {
        switch (columnInfo.type) {
          case 'numeric':
            insights.push(this.generateNumericInsight(columnName, columnInfo));
            break;
          case 'categorical':
            insights.push(this.generateCategoricalInsight(columnName, columnInfo));
            break;
          case 'date':
            insights.push(this.generateDateInsight(columnName, columnInfo));
            break;
        }
      }
  
      // Sort by importance
      return insights.sort((a, b) => b.importance - a.importance);
    }
  
    // Generate numeric column insight
    generateNumericInsight(columnName, columnInfo) {
      const { stats } = columnInfo;
      return {
        type: 'numeric',
        importance: 80,
        title: `Numeric Analysis: ${columnName}`,
        description: `Values range from ${stats.min} to ${stats.max} with an average of ${stats.mean?.toFixed(2)}.`,
        suggestedVisualizations: ['histogram', 'boxplot']
      };
    }
  
    // Generate categorical column insight
    generateCategoricalInsight(columnName, columnInfo) {
      return {
        type: 'categorical',
        importance: 70,
        title: `Category Analysis: ${columnName}`,
        description: `Contains ${columnInfo.uniqueValues} unique categories.`,
        suggestedVisualizations: ['pie', 'bar']
      };
    }
  
    // Generate date column insight
    generateDateInsight(columnName, columnInfo) {
      return {
        type: 'date',
        importance: 90,
        title: `Temporal Analysis: ${columnName}`,
        description: 'Contains date/time values suitable for trend analysis.',
        suggestedVisualizations: ['line', 'area']
      };
    }
  
    // Generate visualization suggestions
    generateVisualizationSuggestions() {
      const suggestions = [];
      const columns = Object.entries(this.columnTypes);
  
      // Single column visualizations
      columns.forEach(([columnName, columnInfo]) => {
        suggestions.push(...this.generateColumnSuggestions(columnName, columnInfo));
      });
  
      // Two-column relationships
      for (let i = 0; i < columns.length; i++) {
        for (let j = i + 1; j < columns.length; j++) {
          suggestions.push(...this.generateRelationshipSuggestions(
            columns[i][0], columns[i][1],
            columns[j][0], columns[j][1]
          ));
        }
      }
  
      return suggestions.sort((a, b) => b.score - a.score);
    }
  
    // Generate suggestions for a single column
    generateColumnSuggestions(columnName, columnInfo) {
      const suggestions = [];
  
      switch (columnInfo.type) {
        case 'numeric':
          suggestions.push({
            type: 'distribution',
            title: `Distribution of ${columnName}`,
            description: 'Understand the value distribution',
            score: 80,
            visualization: {
              type: 'histogram',
              config: {
                x: columnName,
                binCount: 20
              }
            }
          });
          break;
  
        case 'categorical':
          suggestions.push({
            type: 'frequency',
            title: `${columnName} Categories`,
            description: 'Compare category frequencies',
            score: 75,
            visualization: {
              type: 'bar',
              config: {
                x: columnName,
                y: 'count'
              }
            }
          });
          break;
  
        case 'date':
          suggestions.push({
            type: 'trend',
            title: `${columnName} Timeline`,
            description: 'Analyze temporal patterns',
            score: 85,
            visualization: {
              type: 'line',
              config: {
                x: columnName,
                y: 'value'
              }
            }
          });
          break;
      }
  
      return suggestions;
    }
  
    // Generate suggestions for relationships between columns
    generateRelationshipSuggestions(col1Name, col1Info, col2Name, col2Info) {
      const suggestions = [];
  
      // Numeric vs Numeric
      if (col1Info.type === 'numeric' && col2Info.type === 'numeric') {
        suggestions.push({
          type: 'correlation',
          title: `${col1Name} vs ${col2Name}`,
          description: 'Explore relationship between numeric variables',
          score: 90,
          visualization: {
            type: 'scatter',
            config: {
              x: col1Name,
              y: col2Name
            }
          }
        });
      }
  
      // Categorical vs Numeric
      if ((col1Info.type === 'categorical' && col2Info.type === 'numeric') ||
          (col1Info.type === 'numeric' && col2Info.type === 'categorical')) {
        const catColumn = col1Info.type === 'categorical' ? col1Name : col2Name;
        const numColumn = col1Info.type === 'numeric' ? col1Name : col2Name;
  
        suggestions.push({
          type: 'comparison',
          title: `${numColumn} by ${catColumn}`,
          description: 'Compare numeric values across categories',
          score: 85,
          visualization: {
            type: 'boxplot',
            config: {
              x: catColumn,
              y: numColumn
            }
          }
        });
      }
  
      // Categorical vs Categorical
      if (col1Info.type === 'categorical' && col2Info.type === 'categorical') {
        suggestions.push({
          type: 'relationship',
          title: `${col1Name} vs ${col2Name}`,
          description: 'Analyze category relationships',
          score: 70,
          visualization: {
            type: 'heatmap',
            config: {
              x: col1Name,
              y: col2Name
            }
          }
        });
      }
  
      return suggestions;
    }
  
    // Subscribe to analysis updates
    subscribe(callback) {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }
  
    // Notify subscribers of updates
    notifySubscribers() {
      this.subscribers.forEach(callback => callback({
        insights: this.insights,
        suggestions: this.suggestions,
        analysisComplete: this.analysisComplete
      }));
    }
  }
  
  export const analysisService = new AnalysisService();
  export default analysisService;