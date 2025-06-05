import { useState } from "react";
import { X, Bed, Bath, Calendar, Home, MapPin, DollarSign, TrendingUp, Calculator, Brain, ChevronLeft, ChevronRight, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Property } from "@shared/schema";
import { aiService } from "@/lib/ai-service";

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  allProperties: Property[];
}

interface ValuationAnalysis {
  estimatedValue: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  marketPosition: 'Undervalued' | 'Fair Value' | 'Overvalued';
  keyInsights: string[];
  investmentRating: number;
  riskFactors: string[];
  opportunities: string[];
  recommendation: string;
  comparableCount: number;
}

export default function PropertyDetailModal({ property, isOpen, onClose, allProperties }: PropertyDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [analysis, setAnalysis] = useState<ValuationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!property) return null;

  const photos = property.photoUrls || [];

  const calculateInvestmentMetrics = (property: Property) => {
    const estimatedRent = property.estimatedRent || property.price * 0.005;
    const monthlyMortgage = property.price * 0.004;
    const monthlyExpenses = (property.hoaFees || 0) + estimatedRent * 0.1;
    const monthlyROI = ((estimatedRent - monthlyMortgage - monthlyExpenses) / property.price) * 100;

    return {
      estimatedRent: Math.round(estimatedRent),
      monthlyMortgage: Math.round(monthlyMortgage),
      monthlyExpenses: Math.round(monthlyExpenses),
      monthlyROI: monthlyROI.toFixed(2),
      capRate: ((estimatedRent * 12) / property.price * 100).toFixed(2),
      pricePerSqft: Math.round(property.price / property.sqft)
    };
  };

  const analyzeProperty = async () => {
    setIsAnalyzing(true);
    
    try {
      // Find comparable properties
      const comparables = allProperties
        .filter(p => p.status === 'C')
        .filter(p => {
          const sqftMatch = Math.abs(p.sqft - property.sqft) <= (property.sqft * 0.3);
          const bedsMatch = Math.abs(p.beds - property.beds) <= 1;
          const bathsMatch = Math.abs(p.baths - property.baths) <= 1;
          return sqftMatch && bedsMatch && bathsMatch;
        })
        .sort((a, b) => Math.abs(a.sqft - property.sqft) - Math.abs(b.sqft - property.sqft))
        .slice(0, 8);

      // Calculate market metrics
      const avgPricePerSqft = comparables.reduce((sum, p) => sum + (p.price / p.sqft), 0) / comparables.length;
      const estimatedValue = Math.round(avgPricePerSqft * property.sqft);
      const priceVariance = ((property.price - estimatedValue) / estimatedValue) * 100;

      const analysisPrompt = `Analyze this property for a potential buyer:

PROPERTY DETAILS:
- Address: ${property.address}, ${property.city}, ${property.state}
- Asking Price: $${property.price.toLocaleString()}
- Square Feet: ${property.sqft}
- Bedrooms: ${property.beds}
- Bathrooms: ${property.baths}
- Year Built: ${property.yearBuilt || 'Unknown'}
- Days on Market: ${property.daysOnMarket || 'Unknown'}

MARKET ANALYSIS:
- ${comparables.length} comparable sales found
- Market value estimate: $${estimatedValue.toLocaleString()} (${Math.round(avgPricePerSqft)}/sq ft)
- Price variance: ${priceVariance > 0 ? '+' : ''}${priceVariance.toFixed(1)}%

Provide analysis in JSON format:
{
  "marketPosition": "Undervalued|Fair Value|Overvalued",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "investmentRating": 1-5,
  "riskFactors": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "recommendation": "brief recommendation"
}`;

      const response = await aiService.queryData(analysisPrompt, allProperties, {
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
        aiAnalysis = {
          marketPosition: priceVariance > 10 ? 'Overvalued' : priceVariance < -10 ? 'Undervalued' : 'Fair Value',
          keyInsights: [
            `Property is priced ${Math.abs(priceVariance).toFixed(1)}% ${priceVariance > 0 ? 'above' : 'below'} market average`,
            `Comparable properties averaged $${Math.round(avgPricePerSqft)}/sq ft`,
            `${comparables.length} similar properties found in recent sales`
          ],
          investmentRating: priceVariance < -5 ? 4 : priceVariance > 15 ? 2 : 3,
          riskFactors: priceVariance > 10 ? ['Above market pricing'] : ['Standard market risks'],
          opportunities: priceVariance < -5 ? ['Below market pricing'] : ['Standard opportunity'],
          recommendation: priceVariance < -10 ? 'Strong Buy' : priceVariance > 15 ? 'Overpriced' : 'Fair Deal'
        };
      }

      setAnalysis({
        estimatedValue,
        confidenceLevel: comparables.length >= 5 ? 'High' : comparables.length >= 3 ? 'Medium' : 'Low',
        marketPosition: aiAnalysis.marketPosition,
        keyInsights: aiAnalysis.keyInsights,
        investmentRating: aiAnalysis.investmentRating,
        riskFactors: aiAnalysis.riskFactors,
        opportunities: aiAnalysis.opportunities,
        recommendation: aiAnalysis.recommendation,
        comparableCount: comparables.length
      });

    } catch (error) {
      console.error('Analysis error:', error);
      
      const avgPrice = allProperties.reduce((sum, p) => sum + p.price, 0) / allProperties.length;
      setAnalysis({
        estimatedValue: Math.round(avgPrice),
        confidenceLevel: 'Medium',
        marketPosition: 'Fair Value',
        keyInsights: ['Analysis based on market averages', 'Consider professional appraisal'],
        investmentRating: 3,
        riskFactors: ['Limited comparable data'],
        opportunities: ['Standard market opportunity'],
        recommendation: 'Conduct additional due diligence',
        comparableCount: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const metrics = calculateInvestmentMetrics(property);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{property.address}</h2>
              <p className="text-sm text-gray-600">{property.city}, {property.state} {property.zipCode}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Property Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">${property.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Sale Price</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold">{property.beds}</p>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold">{property.baths}</p>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold">{property.sqft.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Square Feet</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">{property.propertyType}</Badge>
                  <Badge variant={property.status === 'C' ? 'default' : 'outline'}>{property.status === 'C' ? 'Sold' : property.status}</Badge>
                  {property.yearBuilt && <Badge variant="outline">Built {property.yearBuilt}</Badge>}
                  {property.daysOnMarket && <Badge variant="outline">{property.daysOnMarket} DOM</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Investment Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Investment Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Price per Sq Ft</p>
                    <p className="text-lg font-semibold">${metrics.pricePerSqft}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Est. Monthly Rent</p>
                    <p className="text-lg font-semibold">${metrics.estimatedRent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cap Rate</p>
                    <p className="text-lg font-semibold">{metrics.capRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.lotSize && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lot Size:</span>
                      <span>{property.lotSize} acres</span>
                    </div>
                  )}
                  {property.listDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">List Date:</span>
                      <span>{new Date(property.listDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {property.saleDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sale Date:</span>
                      <span>{new Date(property.saleDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {property.hoaFees && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">HOA Fees:</span>
                      <span>${property.hoaFees}/month</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            {photos.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <img 
                      src={photos[currentPhotoIndex]} 
                      alt={`Property photo ${currentPhotoIndex + 1}`}
                      className="w-full h-96 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDIwIDYgMTYuMjEgNiAxNEM2IDExLjc5IDkuNzkgOCAxMiA4UzE4IDExLjc5IDE4IDE0QzE4IDE2LjIxIDE0LjIxIDIwIDEyIDE2WiIgZmlsbD0iIzkxOTRBNCIvPgo8L3N2Zz4K';
                      }}
                    />
                    
                    {photos.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2"
                          onClick={prevPhoto}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={nextPhoto}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                          <Badge variant="secondary">
                            {currentPhotoIndex + 1} of {photos.length}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {photos.length > 1 && (
                    <div className="flex space-x-2 mt-4 overflow-x-auto">
                      {photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          className={`w-20 h-20 object-cover rounded cursor-pointer ${
                            index === currentPhotoIndex ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setCurrentPhotoIndex(index)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No photos available for this property</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ai-analysis" className="space-y-6">
            {!analysis ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>AI Property Valuation Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Get an unbiased AI analysis of this property's market value, investment potential, and risks.
                  </p>
                  <Button onClick={analyzeProperty} disabled={isAnalyzing} className="w-full">
                    {isAnalyzing ? 'Analyzing Property...' : 'Analyze Property Value'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Analysis Summary */}
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
                        <p className="text-sm text-gray-600">Est. Market Value</p>
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
                        <p className="text-sm text-gray-600">Confidence</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">AI Recommendation</h4>
                      <p className="text-sm">{analysis.recommendation}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Based on {analysis.comparableCount} comparable sales
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Insights</CardTitle>
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
                      <CardTitle className="text-lg">Opportunities</CardTitle>
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

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Factors</CardTitle>
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
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}