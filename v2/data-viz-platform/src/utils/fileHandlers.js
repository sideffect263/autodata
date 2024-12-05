import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Constants for file processing
const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for mobile
  SUPPORTED_TYPES: {
    csv: ['text/csv', 'csv'],
    json: ['application/json', 'json'],
    excel: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'xlsx',
      'xls'
    ]
  }
};

/**
 * Main file processing function with progress tracking and mobile support
 */
export const processFile = async (file, options = {}) => {
  const {
    onProgress = () => {},
    maxFileSize = FILE_CONSTANTS.MAX_FILE_SIZE,
    chunkSize = FILE_CONSTANTS.CHUNK_SIZE
  } = options;

  try {
    // Validate file size
    if (file.size > maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${maxFileSize / (1024 * 1024)}MB`);
    }

    // Check if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Detect file type
    const fileType = getFileType(file);
    onProgress(0, `Detecting file type: ${fileType}`);

    // Process file based on type and platform
    let data = null;
    if (isMobile) {
      data = await processMobileFile(file, fileType, { onProgress, chunkSize });
    } else {
      data = await processDesktopFile(file, fileType, { onProgress });
    }

    // Validate and clean data
    onProgress(90, 'Validating data');
    const cleanedData = await validateAndCleanData(data);

    onProgress(100, 'Processing complete');

    return {
      data: cleanedData,
      metadata: {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        rowCount: cleanedData.length,
        columnCount: Object.keys(cleanedData[0] || {}).length,
        timestamp: new Date().toISOString(),
        processingPlatform: isMobile ? 'mobile' : 'desktop'
      }
    };
  } catch (error) {
    // Enhanced error handling with specific error types
    if (error.name === 'QuotaExceededError') {
      throw new Error('Mobile browser storage limit exceeded. Try processing a smaller file.');
    }
    throw new Error(`Error processing file: ${error.message}`);
  }
};

/**
 * Process individual file chunks, especially important for mobile
 */
const processFileChunk = async (chunk, fileType) => {
  return new Promise(async (resolve, reject) => {
    try {
      let chunkData = null;
      
      switch (fileType) {
        case 'csv':
          chunkData = await new Promise((resolveChunk) => {
            Papa.parse(chunk, {
              header: true,
              dynamicTyping: true,
              skipEmptyLines: 'greedy',
              complete: (results) => {
                if (results.errors.length > 0) {
                  reject(new Error(`CSV chunk parsing error: ${results.errors[0].message}`));
                } else {
                  resolveChunk(results.data);
                }
              },
              error: (error) => reject(error)
            });
          });
          break;

        case 'json':
          const reader = new FileReader();
          chunkData = await new Promise((resolveChunk) => {
            reader.onload = (event) => {
              try {
                const data = JSON.parse(event.target.result);
                resolveChunk(Array.isArray(data) ? data : [data]);
              } catch (error) {
                reject(new Error('Invalid JSON in chunk'));
              }
            };
            reader.onerror = () => reject(new Error('Error reading JSON chunk'));
            reader.readAsText(chunk);
          });
          break;

        case 'excel':
          const arrayBuffer = await chunk.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { 
            type: 'array',
            cellDates: true,
            dateNF: 'yyyy-mm-dd'
          });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          chunkData = XLSX.utils.sheet_to_json(worksheet, {
            defval: null,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });
          break;

        default:
          throw new Error('Unsupported file type for chunk processing');
      }

      // Basic validation of chunk data
      if (!Array.isArray(chunkData)) {
        throw new Error('Chunk data must be an array');
      }

      resolve(chunkData);
    } catch (error) {
      reject(new Error(`Error processing file chunk: ${error.message}`));
    }
  });
};

/**
 * Mobile-specific file processing with chunking
 */
const processMobileFile = async (file, fileType, { onProgress, chunkSize }) => {
  const chunks = Math.ceil(file.size / chunkSize);
  let processedData = [];

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // Process chunk based on file type
    const chunkData = await processFileChunk(chunk, fileType);
    processedData = processedData.concat(chunkData);

    onProgress((i + 1) / chunks * 80, `Processing chunk ${i + 1}/${chunks}`);
  }

  return processedData;
};

/**
 * Desktop file processing
 */
const processDesktopFile = async (file, fileType, { onProgress }) => {
  onProgress(10, 'Starting file processing');
  
  let data = null;
  switch (fileType) {
    case 'csv':
      data = await parseCSV(file, { onProgress });
      break;
    case 'json':
      data = await parseJSON(file, { onProgress });
      break;
    case 'excel':
      data = await parseExcel(file, { onProgress });
      break;
    default:
      throw new Error('Unsupported file type');
  }

  return data;
};

/**
 * Enhanced file type detection with better validation
 */
const getFileType = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  const mimeType = file.type;

  for (const [type, validTypes] of Object.entries(FILE_CONSTANTS.SUPPORTED_TYPES)) {
    if (validTypes.includes(mimeType) || validTypes.includes(extension)) {
      return type;
    }
  }

  throw new Error(`Unsupported file type: ${extension}. Supported types: CSV, JSON, Excel`);
};

/**
 * Improved CSV parsing with better error handling
 */
const parseCSV = (file, { onProgress }) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy', // Skip truly empty rows
      transform: (value) => value === '' ? null : value, // Convert empty strings to null
      transformHeader: (header) => header.trim(), // Trim header names
      error: (error) => reject(new Error(`CSV parsing error: ${error.message}`)),
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMessages = results.errors
            .map(err => `Row ${err.row}: ${err.message}`)
            .join('; ');
          reject(new Error(`CSV parsing errors: ${errorMessages}`));
        } else {
          resolve(results.data);
        }
      }
    });
  });
};

/**
 * Improved JSON parsing with type checking
 */
const parseJSON = (file, { onProgress }) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const rawData = JSON.parse(event.target.result);
        
        // Handle different JSON structures
        let data;
        if (Array.isArray(rawData)) {
          data = rawData;
        } else if (typeof rawData === 'object' && rawData !== null) {
          // Handle nested data structures
          if (Array.isArray(rawData.data)) {
            data = rawData.data;
          } else {
            data = [rawData];
          }
        } else {
          throw new Error('JSON must contain an array or object');
        }

        onProgress(50, 'JSON parsed successfully');
        resolve(data);
      } catch (error) {
        reject(new Error(`Invalid JSON format: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading JSON file'));
    reader.readAsText(file);
  });
};

/**
 * Improved Excel parsing with sheet selection
 */
const parseExcel = (file, { onProgress }) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { 
          type: 'array',
          cellDates: true, // Properly handle dates
          dateNF: 'yyyy-mm-dd' // Standardize date format
        });

        // Use first sheet if only one exists, otherwise use the active sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        onProgress(70, 'Parsing Excel data');

        const data = XLSX.utils.sheet_to_json(worksheet, {
          defval: null, // Use null for empty cells
          raw: false, // Convert types appropriately
          dateNF: 'yyyy-mm-dd'
        });

        resolve(data);
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading Excel file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Enhanced data validation and cleaning
 */
const validateAndCleanData = async (data) => {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }

  if (data.length === 0) {
    throw new Error('Data array is empty');
  }

  // Remove rows with all null/undefined/empty values
  const cleanData = data.filter(row => {
    if (typeof row !== 'object' || row === null) {
      return false;
    }
    return Object.values(row).some(value => 
      value !== null && 
      value !== undefined && 
      value !== '' &&
      !(typeof value === 'number' && isNaN(value))
    );
  });

  if (cleanData.length === 0) {
    throw new Error('No valid data rows found after cleaning');
  }

  // Validate data structure consistency
  const firstRowKeys = Object.keys(cleanData[0]);
  if (firstRowKeys.length === 0) {
    throw new Error('No columns found in data');
  }

  // Check column consistency and types
  const isConsistent = cleanData.every((row, index) => {
    // Check if row is an object
    if (typeof row !== 'object' || row === null) {
      throw new Error(`Invalid row at index ${index}: not an object`);
    }

    // Check column consistency
    const rowKeys = Object.keys(row);
    const hasAllColumns = firstRowKeys.every(key => key in row);
    const hasSameColumns = rowKeys.length === firstRowKeys.length;

    return hasAllColumns && hasSameColumns;
  });

  if (!isConsistent) {
    throw new Error('Inconsistent data structure across rows');
  }

  return cleanData;
};

export const utils = {
  isFileSupportted: (file) => {
    try {
      getFileType(file);
      return true;
    } catch {
      return false;
    }
  },
  getFileInfo: (file) => ({
    name: file.name,
    size: file.size,
    type: getFileType(file),
    lastModified: new Date(file.lastModified)
  })
};