import { useState } from "react";
import { TrendingUp, TrendingDown, Target, Calendar, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Property } from "@shared/schema";

interface MarketInsightsProps {
  data: Property[];
}

export default function MarketInsights({ data }: MarketInsightsProps) {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y'>('90d');

  // Calculate market velocity metrics
  const calculateMarketVelocity = () => {
    const soldProperties = data.filter(p => p.status === 'Sold' && p.daysOnMarket);
    const fastSales = soldProperties.filter(p => p.daysOnMarket! <= 14).length;
    const normalSales = soldProperties.filter(p => p.daysOnMarket! > 14 && p.daysOnMarket! <= 60).length;
    const slowSales = soldProperties.filter(p => p.daysOnMarket! > 60).length;

    return {
      fast: Math.round((fastSales / soldProperties.length) * 100) || 0,
      normal: Math.round((normalSales / soldProperties.length) * 100) || 0,
      slow: Math.round((slowSales / soldProperties.length) * 100) || 0,
      total: soldProperties.length
    };
  };

  // Price per square foot analysis by area
  const analyzePricePerSqftByArea = () => {
    const areaAnalysis = data.reduce((acc, property) => {
      const area = property.zipCode || property.city || 'Unknown';
      if (!acc[area]) {
        acc[area] = { prices: [], count: 0, totalSqft: 0 };
      }
      const pricePerSqft = property.price / property.sqft;
      acc[area].prices.push(pricePerSqft);
      acc[area].count++;
      acc[area].totalSqft += property.sqft;
      return acc;
    }, {} as Record<string, { prices: number[], count: number, totalSqft: number }>);

    return Object.entries(areaAnalysis)
      .map(([area, data]) => ({
        area,
        avgPricePerSqft: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length),
        count: data.count,
        avgSqft: Math.round(data.totalSqft / data.count)
      }))
      .sort((a, b) => b.avgPricePerSqft - a.avgPricePerSqft)
      .slice(0, 10);
  };

  // Calculate absorption rate and inventory metrics
  const calculateInventoryMetrics = () => {
    const activeListings = data.filter(p => p.status === 'Active').length;
    const soldThisQuarter = data.filter(p => p.status === 'Sold').length;
    const monthsOfInventory = soldThisQuarter > 0 ? (activeListings / (soldThisQuarter / 3)) : 0;

    return {
      activeListings,
      soldThisQuarter,
      monthsOfInventory: Math.round(monthsOfInventory * 10) / 10,
      marketCondition: monthsOfInventory < 3 ? 'Seller\'s Market' : 
                      monthsOfInventory > 6 ? 'Buyer\'s Market' : 'Balanced Market'
    };
  };

  // List-to-sale price analysis
  const analyzeListToSaleRatio = () => {
    const propertiesWithBoth = data.filter(p => 
      p.listPrice && p.salePrice && p.status === 'Sold'
    );

    if (propertiesWithBoth.length === 0) return null;

    const ratios = propertiesWithBoth.map(p => (p.salePrice! / p.listPrice!) * 100);
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const above100 = ratios.filter(r => r > 100).length;
    const below95 = ratios.filter(r => r < 95).length;

    return {
      avgRatio: Math.round(avgRatio * 10) / 10,
      multipleOffers: Math.round((above100 / propertiesWithBoth.length) * 100),
      priceReductions: Math.round((below95 / propertiesWithBoth.length) * 100),
      totalAnalyzed: propertiesWithBoth.length
    };
  };

  const velocity = calculateMarketVelocity();
  const areaAnalysis = analyzePricePerSqftByArea();
  const inventory = calculateInventoryMetrics();
  const listToSale = analyzeListToSaleRatio();

  return (
    <div className="space-y-6">
      {/* Market Condition Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Market Conditions</span>
            <Badge variant={inventory.marketCondition.includes('Seller') ? 'destructive' : 
                           inventory.marketCondition.includes('Buyer') ? 'secondary' : 'default'}>
              {inventory.marketCondition}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{inventory.activeListings}</p>
              <p className="text-sm text-gray-600">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{inventory.soldThisQuarter}</p>
              <p className="text-sm text-gray-600">Sold This Quarter</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{inventory.monthsOfInventory}</p>
              <p className="text-sm text-gray-600">Months of Inventory</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{velocity.fast}%</p>
              <p className="text-sm text-gray-600">Fast Sales (&lt;14 days)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="velocity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="velocity">Market Velocity</TabsTrigger>
          <TabsTrigger value="areas">Area Analysis</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Trends</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
        </TabsList>

        <TabsContent value="velocity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Velocity Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Fast Sales (≤14 days)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: `${velocity.fast}%`}}></div>
                    </div>
                    <span className="font-semibold">{velocity.fast}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Normal Sales (15-60 days)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: `${velocity.normal}%`}}></div>
                    </div>
                    <span className="font-semibold">{velocity.normal}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Slow Sales (&gt;60 days)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{width: `${velocity.slow}%`}}></div>
                    </div>
                    <span className="font-semibold">{velocity.slow}%</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Based on {velocity.total} sold properties
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Per Square Foot by Area</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {areaAnalysis.map((area, index) => (
                  <div key={area.area} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{area.area}</p>
                      <p className="text-sm text-gray-600">{area.count} properties • Avg {area.avgSqft.toLocaleString()} sq ft</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${area.avgPricePerSqft}/sq ft</p>
                      {index === 0 && <Badge variant="secondary">Highest</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          {listToSale ? (
            <Card>
              <CardHeader>
                <CardTitle>List-to-Sale Price Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{listToSale.avgRatio}%</p>
                    <p className="text-sm text-gray-600">Average Sale-to-List Ratio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{listToSale.multipleOffers}%</p>
                    <p className="text-sm text-gray-600">Multiple Offer Situations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{listToSale.priceReductions}%</p>
                    <p className="text-sm text-gray-600">Price Reductions</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Analysis based on {listToSale.totalAnalyzed} sold properties with both list and sale prices
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600">List-to-sale price analysis requires properties with both list and sale prices</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="competition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Market Hotspots</h4>
                  {areaAnalysis.slice(0, 3).map(area => (
                    <div key={area.area} className="flex justify-between items-center mb-2">
                      <span className="text-sm">{area.area}</span>
                      <Badge variant="outline">${area.avgPricePerSqft}/sq ft</Badge>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Opportunity Areas</h4>
                  {areaAnalysis.slice(-3).reverse().map(area => (
                    <div key={area.area} className="flex justify-between items-center mb-2">
                      <span className="text-sm">{area.area}</span>
                      <Badge variant="secondary">${area.avgPricePerSqft}/sq ft</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}