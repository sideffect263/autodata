// src/utils/deviceDetection.js
export const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      .test(navigator.userAgent);
  };
  
  export const getDeviceMemory = () => {
    if (typeof navigator === 'undefined') return 4;
    return navigator.deviceMemory || 4;
  };
  
  export const getDevicePerformance = () => {
    if (!window.performance) return 'medium';
    
    const memory = getDeviceMemory();
    if (memory <= 2) return 'low';
    if (memory >= 8) return 'high';
    return 'medium';
  };
  
  export const shouldUseWebWorker = () => {
    return typeof Worker !== 'undefined' && 
           getDevicePerformance() !== 'low';
  };