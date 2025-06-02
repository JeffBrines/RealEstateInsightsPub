import { useState } from "react";
import { Calculator, Target, TrendingUp, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Property } from "@shared/schema";

interface ComparableAnalysisProps {
  data: Property[];
}

export default function ComparableAnalysis({ data }: ComparableAnalysisProps) {
  const [subjectProperty, setSubjectProperty] = useState({
    sqft: '',
    beds: '',
    baths: '',
    zipCode: '',
    priceRange: 10 // percentage
  });

  const findComparables = () => {
    if (!subjectProperty.sqft || !subjectProperty.beds || !subjectProperty.baths) {
      return [];
    }

    const targetSqft = parseInt(subjectProperty.sqft);
    const targetBeds = parseInt(subjectProperty.beds);
    const targetBaths = parseInt(subjectProperty.baths);
    const sqftRange = targetSqft * 0.2; // 20% range

    return data
      .filter(p => p.status === 'Sold' && p.saleDate)
      .filter(p => {
        const sqftMatch = Math.abs(p.sqft - targetSqft) <= sqftRange;
        const bedsMatch = p.beds === targetBeds;
        const bathsMatch = Math.abs(p.baths - targetBaths) <= 0.5;
        const areaMatch = subjectProperty.zipCode ? p.zipCode === subjectProperty.zipCode : true;
        
        return sqftMatch && bedsMatch && bathsMatch && areaMatch;
      })
      .map(p => ({
        ...p,
        pricePerSqft: p.price / p.sqft,
        sqftDiff: Math.abs(p.sqft - targetSqft),
        adjustedPrice: p.price // This would include adjustments in a real CMA
      }))
      .sort((a, b) => a.sqftDiff - b.sqftDiff)
      .slice(0, 10);
  };

  const calculateCMAValue = (comparables: ReturnType<typeof findComparables>) => {
    if (comparables.length === 0) return null;

    const avgPricePerSqft = comparables.reduce((sum, comp) => sum + comp.pricePerSqft, 0) / comparables.length;
    const medianPricePerSqft = comparables
      .map(c => c.pricePerSqft)
      .sort((a, b) => a - b)[Math.floor(comparables.length / 2)];

    const targetSqft = parseInt(subjectProperty.sqft);
    const estimatedValueAvg = avgPricePerSqft * targetSqft;
    const estimatedValueMedian = medianPricePerSqft * targetSqft;

    return {
      avgPricePerSqft: Math.round(avgPricePerSqft),
      medianPricePerSqft: Math.round(medianPricePerSqft),
      estimatedValueAvg: Math.round(estimatedValueAvg),
      estimatedValueMedian: Math.round(estimatedValueMedian),
      confidenceScore: Math.min(comparables.length * 10, 100),
      comparableCount: comparables.length
    };
  };

  const comparables = findComparables();
  const cmaValue = calculateCMAValue(comparables);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Comparable Market Analysis (CMA)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <Label htmlFor="sqft">Square Feet</Label>
              <Input
                id="sqft"
                placeholder="e.g. 2000"
                value={subjectProperty.sqft}
                onChange={(e) => setSubjectProperty({...subjectProperty, sqft: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="beds">Bedrooms</Label>
              <Input
                id="beds"
                placeholder="e.g. 3"
                value={subjectProperty.beds}
                onChange={(e) => setSubjectProperty({...subjectProperty, beds: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="baths">Bathrooms</Label>
              <Input
                id="baths"
                placeholder="e.g. 2.5"
                value={subjectProperty.baths}
                onChange={(e) => setSubjectProperty({...subjectProperty, baths: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="zipcode">ZIP Code (Optional)</Label>
              <Input
                id="zipcode"
                placeholder="e.g. 78701"
                value={subjectProperty.zipCode}
                onChange={(e) => setSubjectProperty({...subjectProperty, zipCode: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                Find Comparables
              </Button>
            </div>
          </div>

          {cmaValue && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-3">Estimated Market Value</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    ${cmaValue.estimatedValueMedian.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Median-Based Value</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    ${cmaValue.estimatedValueAvg.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Average-Based Value</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    ${cmaValue.medianPricePerSqft}
                  </p>
                  <p className="text-sm text-gray-600">Price Per Sq Ft</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {cmaValue.confidenceScore}%
                  </p>
                  <p className="text-sm text-gray-600">Confidence Score</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 text-center">
                Based on {cmaValue.comparableCount} comparable sales
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {comparables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparable Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Sq Ft</TableHead>
                  <TableHead>$/Sq Ft</TableHead>
                  <TableHead>Beds/Baths</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>DOM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparables.map((comp, index) => (
                  <TableRow key={comp.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{comp.address}</div>
                        <div className="text-sm text-gray-600">
                          {comp.city}, {comp.state} {comp.zipCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${comp.price.toLocaleString()}
                    </TableCell>
                    <TableCell>{comp.sqft.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                      ${Math.round(comp.pricePerSqft)}
                    </TableCell>
                    <TableCell>{comp.beds}/{comp.baths}</TableCell>
                    <TableCell>
                      {comp.saleDate ? new Date(comp.saleDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {comp.daysOnMarket ? `${comp.daysOnMarket} days` : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {subjectProperty.sqft && subjectProperty.beds && subjectProperty.baths && comparables.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">
              No comparable sales found with the specified criteria. Try adjusting the square footage, bedroom/bathroom count, or removing the ZIP code filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}