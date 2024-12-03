// src/hooks/useVisualizationData.js
import { useMemo } from 'react';
import { processDataForVisualization } from '../utils/visualization3DUtils';

export const useVisualizationData = (data, columns, type) => {
  return useMemo(() => {
    if (!data || !columns.x || !columns.y || !columns.z) {
      return null;
    }

    switch (type) {
      case 'scatter':
        return processDataForVisualization.scatterPlot(data, columns);
      case 'bar':
        return processDataForVisualization.barChart(data, columns);
      case 'surface':
        return processDataForVisualization.surfacePlot(data, columns);
      default:
        return null;
    }
  }, [data, columns, type]);
};