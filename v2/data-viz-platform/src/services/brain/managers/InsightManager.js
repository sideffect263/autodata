// src/services/brain/managers/InsightManager.js
import { insightGenerator } from '../analyzers/insightGenerator';

export class InsightManager {
  constructor() {
    this.generator = insightGenerator;
    this.settings = {
      maxInsights: 20,
      minConfidence: 0.6
    };
  }

  async initialize(settings = {}) {
    this.settings = { ...this.settings, ...settings };
  }

  async generateInsights(data, analysis) {
    try {
      const insights = await this.generator.generateInsights(
        data,
        analysis.columns,
        analysis.patterns
      );

      return this.filterAndRankInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return [];
    }
  }

  filterAndRankInsights(insights) {
    return insights
      .filter(i => i.score >= this.settings.minConfidence)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.settings.maxInsights);
  }

  getColumnInsights(insights, columnName) {
    return insights.filter(insight => 
      insight.columns?.includes(columnName) || 
      insight.column === columnName
    );
  }
}