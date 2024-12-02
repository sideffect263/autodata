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

    return {
      data: validateAndCleanData(data),
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
        const arrayData = Array.isArray(data) ? data : [data];
        resolve(arrayData);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
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
        const data = XLSX.utils.sheet_to_json(firstSheet, { defval: null });
        resolve(data);
      } catch (error) {
        reject(new Error('Error parsing Excel file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

const validateAndCleanData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data must be a non-empty array');
  }

  // Remove rows with all null/undefined values
  const cleanData = data.filter(row => {
    return Object.values(row).some(value => value != null && value !== '');
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
