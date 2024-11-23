// src/utils/fileHandlers.js
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const processFile = async (file) => {
  try {
    const fileType = getFileType(file);
    let data = null;

    switch (fileType) {
      case 'csv':
        data = await parseCSV(file);
        break;
      case 'json':
        data = await parseJSON(file);
        break;
      case 'excel':
        data = await parseExcel(file);
        break;
      default:
        throw new Error('Unsupported file type');
    }

    // Validate and analyze the data
    const validatedData = validateData(data);
    const analysis = analyzeData(validatedData);

    return {
      data: validatedData,
      analysis,
      metadata: {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`Error processing file: ${error.message}`);
  }
};

const getFileType = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  const mimeType = file.type;

  if (mimeType === 'text/csv' || extension === 'csv') {
    return 'csv';
  } else if (mimeType === 'application/json' || extension === 'json') {
    return 'json';
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    extension === 'xlsx' ||
    extension === 'xls'
  ) {
    return 'excel';
  }
  
  throw new Error('Unsupported file type');
};

const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('Error parsing CSV: ' + results.errors[0].message));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => reject(error)
    });
  });
};

const parseJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        // Ensure data is an array
        const arrayData = Array.isArray(data) ? data : [data];
        resolve(arrayData);
      } catch (error) {
        reject(new Error('Invalid JSON format',error));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Convert to object array with headers
        const headers = data[0];
        const rows = data.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        
        resolve(rows);
      } catch (error) {
        reject(new Error('Error parsing Excel file', error));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

const validateData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data must be a non-empty array');
  }

  // Remove rows with all null/undefined values
  const cleanData = data.filter(row => {
    return Object.values(row).some(value => value != null);
  });

  // Validate data structure consistency
  const firstRowKeys = Object.keys(cleanData[0]);
  const isConsistent = cleanData.every(row => {
    const rowKeys = Object.keys(row);
    return rowKeys.length === firstRowKeys.length &&
           firstRowKeys.every(key => rowKeys.includes(key));
  });

  if (!isConsistent) {
    throw new Error('Inconsistent data structure across rows');
  }

  return cleanData;
};

const analyzeData = (data) => {
  const columns = Object.keys(data[0]);
  const analysis = {
    rowCount: data.length,
    columnCount: columns.length,
    columns: {},
    summary: {
      numericColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      emptyValues: {}
    }
  };

  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const columnAnalysis = analyzeColumn(values);
    analysis.columns[column] = columnAnalysis;
    
    // Categorize column type
    if (columnAnalysis.type === 'number') {
      analysis.summary.numericColumns.push(column);
    } else if (columnAnalysis.type === 'date') {
      analysis.summary.dateColumns.push(column);
    } else {
      analysis.summary.categoricalColumns.push(column);
    }
    
    // Count empty values
    analysis.summary.emptyValues[column] = values.filter(v => v == null || v === '').length;
  });

  return analysis;
};

const analyzeColumn = (values) => {
  const nonNullValues = values.filter(v => v != null && v !== '');
  
  // Determine column type
  const type = determineColumnType(nonNullValues);
  
  const analysis = {
    type,
    uniqueValues: new Set(nonNullValues).size,
    nullCount: values.length - nonNullValues.length
  };

  // Add type-specific analysis
  if (type === 'number') {
    analysis.min = Math.min(...nonNullValues);
    analysis.max = Math.max(...nonNullValues);
    analysis.mean = nonNullValues.reduce((a, b) => a + b, 0) / nonNullValues.length;
  }

  return analysis;
};

const determineColumnType = (values) => {
  const sample = values[0];
  
  if (typeof sample === 'number') return 'number';
  if (sample instanceof Date) return 'date';
  if (!isNaN(Date.parse(sample))) return 'date';
  return 'string';
};

export const generateSampleData = (rowCount = 5) => {
  return Array.from({ length: rowCount }, (_, i) => ({
    id: i + 1,
    name: `Sample ${i + 1}`,
    value: Math.round(Math.random() * 100),
    date: new Date(Date.now() - Math.random() * 10000000000).toISOString()
  }));
};