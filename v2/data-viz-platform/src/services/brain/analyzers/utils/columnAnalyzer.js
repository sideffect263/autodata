// src/services/brain/utils/columnAnalyzer.js

export class ColumnAnalyzer {
    analyzeColumns(data) {
      if (!data || data.length === 0) {
        return {};
      }
  
      const columns = {};
      const sample = data[0];
  
      for (const [key, value] of Object.entries(sample)) {
        const values = data.map(row => row[key]);
        
        columns[key] = {
          name: key,
          type: this.detectColumnType(values),
          unique: new Set(values).size,
          nullCount: values.filter(v => v === null || v === undefined || v === '').length,
          stats: this.calculateColumnStats(values)
        };
      }
  
      return columns;
    }
  
    detectColumnType(values) {
      const nonNullValue = values.find(v => v !== null && v !== undefined && v !== '');
      
      if (typeof nonNullValue === 'number') return 'numeric';
      if (!isNaN(Date.parse(nonNullValue))) return 'date';
      
      const uniqueCount = new Set(values).size;
      if (uniqueCount <= Math.min(10, values.length * 0.1)) return 'categorical';
      
      return 'text';
    }
  
    calculateColumnStats(values) {
      const stats = {
        min: null,
        max: null,
        mean: null,
        median: null,
        distinct: new Set(values).size
      };
  
      if (typeof values[0] === 'number') {
        const numericValues = values.filter(v => typeof v === 'number');
        stats.min = Math.min(...numericValues);
        stats.max = Math.max(...numericValues);
        stats.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        
        // Calculate median
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        stats.median = sorted.length % 2 !== 0 ? 
          sorted[mid] : 
          (sorted[mid - 1] + sorted[mid]) / 2;
      }
  
      return stats;
    }
  
    findRelatedColumns(columns) {
      const relationships = [];
      const columnNames = Object.keys(columns);
  
      for (let i = 0; i < columnNames.length; i++) {
        for (let j = i + 1; j < columnNames.length; j++) {
          const col1 = columnNames[i];
          const col2 = columnNames[j];
  
          if (this.areColumnsRelated(columns[col1], columns[col2])) {
            relationships.push({
              columns: [col1, col2],
              type: this.getRelationshipType(columns[col1], columns[col2])
            });
          }
        }
      }
  
      return relationships;
    }
  
    areColumnsRelated(col1, col2) {
      // Check if columns might be related based on names and types
      const namesRelated = this.areNamesRelated(col1.name, col2.name);
      const typesCompatible = this.areTypesCompatible(col1.type, col2.type);
      
      return namesRelated || typesCompatible;
    }
  
    areNamesRelated(name1, name2) {
      // Simple name relationship detection
      const n1 = name1.toLowerCase();
      const n2 = name2.toLowerCase();
      
      return n1.includes(n2) || 
             n2.includes(n1) || 
             this.getWordSimilarity(n1, n2) > 0.7;
    }
  
    areTypesCompatible(type1, type2) {
      if (type1 === type2) return true;
      
      // Check for compatible type combinations
      const compatiblePairs = [
        ['numeric', 'date'],
        ['categorical', 'text']
      ];
  
      return compatiblePairs.some(([t1, t2]) => 
        (type1 === t1 && type2 === t2) || (type1 === t2 && type2 === t1)
      );
    }
  
    getRelationshipType(col1, col2) {
      if (col1.type === 'numeric' && col2.type === 'numeric') {
        return 'numeric-correlation';
      }
      if (col1.type === 'date' || col2.type === 'date') {
        return 'time-series';
      }
      if (col1.type === 'categorical' || col2.type === 'categorical') {
        return 'categorical-relationship';
      }
      return 'general-relationship';
    }
  
    getWordSimilarity(str1, str2) {
      // Simple Levenshtein distance-based similarity
      const len1 = str1.length;
      const len2 = str2.length;
      const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
  
      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
  
      const maxLen = Math.max(len1, len2);
      return 1 - (matrix[len1][len2] / maxLen);
    }
  }
  
  export const columnAnalyzer = new ColumnAnalyzer();
  export default columnAnalyzer;