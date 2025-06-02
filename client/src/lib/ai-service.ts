import { Property, FilterState, AIResponse } from '@shared/schema';
import { apiRequest } from './queryClient';

class AIService {
  async queryData(
    query: string,
    data: Property[],
    filters: FilterState
  ): Promise<AIResponse> {
    try {
      const response = await apiRequest('POST', '/api/ai/query', {
        query,
        data,
        filters
      });

      return await response.json();
    } catch (error) {
      // Fallback to basic analysis if API fails
      return this.fallbackAnalysis(query, data);
    }
  }

  private fallbackAnalysis(query: string, data: Property[]): AIResponse {
    const queryLower = query.toLowerCase();
    
    // Basic keyword matching for common queries
    if (queryLower.includes('average price') || queryLower.includes('median price')) {
      const prices = data.map(p => p.price);
      const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
      
      return {
        answer: `Based on your data, the average price is $${Math.round(average).toLocaleString()} and the median price is $${Math.round(median).toLocaleString()}.`,
        data: {
          count: data.length,
          average: Math.round(average),
          median: Math.round(median),
        }
      };
    }
    
    if (queryLower.includes('days on market') || queryLower.includes('dom')) {
      const domValues = data.filter(p => p.daysOnMarket).map(p => p.daysOnMarket!);
      const average = domValues.reduce((sum, d) => sum + d, 0) / domValues.length;
      
      return {
        answer: `The average days on market is ${Math.round(average)} days based on ${domValues.length} properties with DOM data.`,
        data: {
          count: domValues.length,
          averageDom: Math.round(average),
        }
      };
    }
    
    if (queryLower.includes('bedroom') || queryLower.includes('bed')) {
      const bedCounts = data.reduce((acc, p) => {
        acc[p.beds] = (acc[p.beds] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const mostCommon = Object.entries(bedCounts)
        .sort(([,a], [,b]) => b - a)[0];
      
      return {
        answer: `Your data contains properties with ${Object.keys(bedCounts).join(', ')} bedrooms. The most common is ${mostCommon[0]} bedrooms with ${mostCommon[1]} properties.`,
        data: bedCounts
      };
    }
    
    // Default response
    return {
      answer: `I found ${data.length} properties in your dataset. The price range is $${Math.min(...data.map(p => p.price)).toLocaleString()} to $${Math.max(...data.map(p => p.price)).toLocaleString()}. Try asking more specific questions about prices, bedrooms, or market metrics.`,
      data: {
        totalProperties: data.length,
        minPrice: Math.min(...data.map(p => p.price)),
        maxPrice: Math.max(...data.map(p => p.price)),
      }
    };
  }
}

export const aiService = new AIService();
