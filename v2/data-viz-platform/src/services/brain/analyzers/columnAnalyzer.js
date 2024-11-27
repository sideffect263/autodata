
// src/services/brain/analyzers/columnAnalyzer.js
export const analyzeColumnTypes = async (data) => {
    if (!data || data.length === 0) return {};
  
    const columns = {};
    const sample = data[0];
  
    for (const [key, value] of Object.entries(sample)) {
      const values = data.map(row => row[key]);
      
      columns[key] = {
        name: key,
        type: detectColumnType(values),
        unique: new Set(values).size,
        nullCount: values.filter(v => v === null || v === undefined || v === '').length,
        stats: calculateColumnStats(values)
      };
    }
  
    return columns;
  };
  
  const detectColumnType = (values) => {
    const nonNullValue = values.find(v => v !== null && v !== undefined && v !== '');
    
    if (typeof nonNullValue === 'number') return 'numeric';
    if (!isNaN(Date.parse(nonNullValue))) return 'date';
    
    const uniqueCount = new Set(values).size;
    if (uniqueCount <= Math.min(10, values.length * 0.1)) return 'categorical';
    
    return 'text';
  };
  
  const calculateColumnStats = (values) => {
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
  };