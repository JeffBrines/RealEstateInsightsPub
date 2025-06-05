import { useState } from "react";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Property } from "@shared/schema";
import { aiService } from "@/lib/ai-service";

interface AIValuationAnalystProps {
  data: Property[];
}

interface ValuationAnalysis {
  propertyAddress: string;
  estimatedValue: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  marketPosition: 'Undervalued' | 'Fair Value' | 'Overvalued';
  keyInsights: string[];
  comparableProperties: Property[];
  investmentRating: number; // 1-5 scale
  riskFactors: string[];
  opportunities: string[];
  marketTrends: string;
  recommendation: string;
}

export default function AIValuationAnalyst({ data }: AIValuationAnalystProps) {
  const [subjectProperty, setSubjectProperty] = useState({
    address: '',
    askingPrice: '',
    sqft: '',
    beds: '',
    baths: '',
    yearBuilt: '',
    propertyType: 'Single Family',
    additionalInfo: ''
  });

  const [analysis, setAnalysis] = useState<ValuationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeProperty = async () => {
    if (!subjectProperty.address || !subjectProperty.askingPrice || !subjectProperty.sqft) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Find comparable properties
      const targetSqft = parseInt(subjectProperty.sqft);
      const targetBeds = parseInt(subjectProperty.beds);
      const targetBaths = parseFloat(subjectProperty.baths);
      const askingPrice = parseInt(subjectProperty.askingPrice);
      
      const comparables = data
        .filter(p => p.status === 'C') // Sold properties
        .filter(p => {
          const sqftMatch = Math.abs(p.sqft - targetSqft) <= (targetSqft * 0.3);
          const bedsMatch = !targetBeds || Math.abs(p.beds - targetBeds) <= 1;
          const bathsMatch = !targetBaths || Math.abs(p.baths - targetBaths) <= 1;
          return sqftMatch && bedsMatch && bathsMatch;
        })
        .sort((a, b) => Math.abs(a.sqft - targetSqft) - Math.abs(b.sqft - targetSqft))
        .slice(0, 8);

      // Calculate market metrics
      const avgPricePerSqft = comparables.reduce((sum, p) => sum + (p.price / p.sqft), 0) / comparables.length;
      const estimatedValue = Math.round(avgPricePerSqft * targetSqft);
      const priceVariance = ((askingPrice - estimatedValue) / estimatedValue) * 100;

      // Generate AI analysis using market data
      const marketContext = {
        totalSales: data.filter(p => p.status === 'C').length,
        averageDOM: data.reduce((sum, p) => sum + (p.daysOnMarket || 0), 0) / data.length,
        priceRange: {
          min: Math.min(...comparables.map(p => p.price)),
          max: Math.max(...comparables.map(p => p.price))
        },
        medianPrice: comparables.sort((a, b) => a.price - b.price)[Math.floor(comparables.length / 2)]?.price || 0
      };

      const analysisPrompt = `You are a professional real estate analyst providing unbiased valuation analysis for a potential buyer. 

SUBJECT PROPERTY:
- Address: ${subjectProperty.address}
- Asking Price: $${askingPrice.toLocaleString()}
- Square Feet: ${subjectProperty.sqft}
- Bedrooms: ${subjectProperty.beds || 'Not specified'}
- Bathrooms: ${subjectProperty.baths || 'Not specified'}
- Year Built: ${subjectProperty.yearBuilt || 'Not specified'}
- Additional Info: ${subjectProperty.additionalInfo || 'None'}

MARKET DATA:
- ${comparables.length} comparable sales found
- Estimated market value: $${estimatedValue.toLocaleString()} (based on $${Math.round(avgPricePerSqft)}/sq ft)
- Price variance: ${priceVariance > 0 ? '+' : ''}${priceVariance.toFixed(1)}%
- Market stats: ${marketContext.totalSales} total sales, ${Math.round(marketContext.averageDOM)} avg days on market

Provide a professional analysis in JSON format with these exact fields:
{
  "marketPosition": "Undervalued|Fair Value|Overvalued",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "investmentRating": 1-5,
  "riskFactors": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "marketTrends": "brief trend analysis",
  "recommendation": "clear buy/pass/negotiate recommendation with reasoning"
}`;

      const response = await aiService.queryData(analysisPrompt, data, {
        priceRange: { min: 0, max: 10000000 },
        beds: undefined,
        baths: undefined,
        propertyTypes: [],
        status: undefined,
        dateRange: undefined,
        location: undefined
      });

      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse(response.answer);
      } catch (e) {
        // Fallback if JSON parsing fails
        aiAnalysis = {
          marketPosition: priceVariance > 10 ? 'Overvalued' : priceVariance < -10 ? 'Undervalued' : 'Fair Value',
          keyInsights: [
            `Property is priced ${Math.abs(priceVariance).toFixed(1)}% ${priceVariance > 0 ? 'above' : 'below'} market average`,
            `Comparable properties sold for $${Math.round(avgPricePerSqft)}/sq ft on average`,
            `${comparables.length} similar properties found in recent sales data`
          ],
          investmentRating: priceVariance < -5 ? 4 : priceVariance > 15 ? 2 : 3,
          riskFactors: priceVariance > 10 ? ['Above market pricing', 'Limited comparable sales'] : ['Market volatility'],
          opportunities: priceVariance < -5 ? ['Below market pricing', 'Good investment potential'] : ['Standard market opportunity'],
          marketTrends: `Average days on market: ${Math.round(marketContext.averageDOM)} days`,
          recommendation: priceVariance < -10 ? 'Strong Buy - Below market value' : 
                         priceVariance > 15 ? 'Pass - Overpriced' : 
                         'Fair Deal - Consider negotiating'
        };
      }

      setAnalysis({
        propertyAddress: subjectProperty.address,
        estimatedValue,
        confidenceLevel: comparables.length >= 5 ? 'High' : comparables.length >= 3 ? 'Medium' : 'Low',
        marketPosition: aiAnalysis.marketPosition,
        keyInsights: aiAnalysis.keyInsights,
        comparableProperties: comparables,
        investmentRating: aiAnalysis.investmentRating,
        riskFactors: aiAnalysis.riskFactors,
        opportunities: aiAnalysis.opportunities,
        marketTrends: aiAnalysis.marketTrends,
        recommendation: aiAnalysis.recommendation
      });

    } catch (error) {
      console.error('Analysis error:', error);
      // Provide fallback analysis using market data
      const avgPricePerSqft = data.reduce((sum, p) => sum + (p.price / p.sqft), 0) / data.length;
      const estimatedValue = Math.round(avgPricePerSqft * parseInt(subjectProperty.sqft));
      
      setAnalysis({
        propertyAddress: subjectProperty.address,
        estimatedValue,
        confidenceLevel: 'Medium',
        marketPosition: 'Fair Value',
        keyInsights: ['Analysis based on market averages', 'Consider local market factors'],
        comparableProperties: [],
        investmentRating: 3,
        riskFactors: ['Limited data available'],
        opportunities: ['Standard market opportunity'],
        marketTrends: 'Market analysis available in Market Insights tab',
        recommendation: 'Consult with local real estate professionals for detailed analysis'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Undervalued': return 'bg-green-100 text-green-800';
      case 'Overvalued': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Property Valuation Analyst</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State"
                value={subjectProperty.address}
                onChange={(e) => setSubjectProperty({...subjectProperty, address: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="askingPrice">Asking Price</Label>
              <Input
                id="askingPrice"
                placeholder="750000"
                value={subjectProperty.askingPrice}
                onChange={(e) => setSubjectProperty({...subjectProperty, askingPrice: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="sqft">Square Feet</Label>
              <Input
                id="sqft"
                placeholder="2000"
                value={subjectProperty.sqft}
                onChange={(e) => setSubjectProperty({...subjectProperty, sqft: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="beds">Bedrooms</Label>
              <Input
                id="beds"
                placeholder="3"
                value={subjectProperty.beds}
                onChange={(e) => setSubjectProperty({...subjectProperty, beds: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="baths">Bathrooms</Label>
              <Input
                id="baths"
                placeholder="2.5"
                value={subjectProperty.baths}
                onChange={(e) => setSubjectProperty({...subjectProperty, baths: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input
                id="yearBuilt"
                placeholder="2010"
                value={subjectProperty.yearBuilt}
                onChange={(e) => setSubjectProperty({...subjectProperty, yearBuilt: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mb-6">
            <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Recent renovations, unique features, market conditions, etc."
              value={subjectProperty.additionalInfo}
              onChange={(e) => setSubjectProperty({...subjectProperty, additionalInfo: e.target.value})}
            />
          </div>

          <Button 
            onClick={analyzeProperty} 
            disabled={isAnalyzing || !subjectProperty.address || !subjectProperty.askingPrice || !subjectProperty.sqft}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing Property...' : 'Analyze Property Value'}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Valuation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    ${analysis.estimatedValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Estimated Value</p>
                </div>
                <div className="text-center">
                  <Badge className={getPositionColor(analysis.marketPosition)}>
                    {analysis.marketPosition}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Market Position</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getRatingColor(analysis.investmentRating)}`}>
                    {analysis.investmentRating}/5
                  </p>
                  <p className="text-sm text-gray-600">Investment Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-purple-600">
                    {analysis.confidenceLevel}
                  </p>
                  <p className="text-sm text-gray-600">Confidence Level</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">AI Recommendation</h4>
                <p className="text-sm">{analysis.recommendation}</p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Key Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyInsights.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Opportunities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Risk Factors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.riskFactors.map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <span>Market Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.marketTrends}</p>
              </CardContent>
            </Card>
          </div>

          {/* Comparable Properties */}
          {analysis.comparableProperties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparable Sales ({analysis.comparableProperties.length} found)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Address</th>
                        <th className="text-left p-2">Sale Price</th>
                        <th className="text-left p-2">$/Sq Ft</th>
                        <th className="text-left p-2">Sq Ft</th>
                        <th className="text-left p-2">Beds/Baths</th>
                        <th className="text-left p-2">Sale Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.comparableProperties.map((comp, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{comp.address}, {comp.city}</td>
                          <td className="p-2 font-medium">${comp.price.toLocaleString()}</td>
                          <td className="p-2">${Math.round(comp.price / comp.sqft)}</td>
                          <td className="p-2">{comp.sqft.toLocaleString()}</td>
                          <td className="p-2">{comp.beds}/{comp.baths}</td>
                          <td className="p-2">{comp.saleDate ? new Date(comp.saleDate).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}