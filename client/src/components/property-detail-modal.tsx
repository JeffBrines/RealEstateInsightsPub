import { Download, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Property } from "@shared/schema";

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
  if (!property) return null;

  const calculateInvestmentMetrics = (property: Property) => {
    const estimatedRent = property.estimatedRent || property.price * 0.005; // 0.5% rule fallback
    const monthlyMortgage = property.price * 0.004; // Rough estimate
    const monthlyExpenses = property.hoaFees || 0 + estimatedRent * 0.1; // 10% for taxes, insurance, etc.
    const cashFlow = estimatedRent - monthlyMortgage - monthlyExpenses;
    const grm = property.price / (estimatedRent * 12);
    const capRate = ((estimatedRent * 12) - (monthlyExpenses * 12)) / property.price * 100;
    const onePercentRule = (estimatedRent / property.price) * 100;

    return {
      estimatedRent,
      cashFlow,
      grm,
      capRate,
      onePercentRule
    };
  };

  const metrics = calculateInvestmentMetrics(property);

  const handleExportProperty = () => {
    const data = {
      address: property.address,
      city: property.city,
      price: property.price,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
      pricePerSqft: property.price / property.sqft,
      daysOnMarket: property.daysOnMarket,
      status: property.status,
      estimatedRent: metrics.estimatedRent,
      capRate: metrics.capRate,
      cashFlow: metrics.cashFlow,
    };

    const csvContent = [
      Object.keys(data).join(','),
      Object.values(data).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `property_${property.id}.csv`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sold': return 'bg-green-100 text-green-800';
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{property.address}</DialogTitle>
          <p className="text-gray-600">{property.city}, {property.state} {property.zipCode}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Property Images */}
          <div>
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
              alt="Property exterior"
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <div className="grid grid-cols-3 gap-2">
              <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                alt="Interior"
                className="h-20 object-cover rounded"
              />
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                alt="Kitchen"
                className="h-20 object-cover rounded"
              />
              <img
                src="https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                alt="Bedroom"
                className="h-20 object-cover rounded"
              />
            </div>
          </div>

          {/* Property Details */}
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">List Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(property.listPrice || property.price).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Sale Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(property.salePrice || property.price).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{property.beds}</p>
                <p className="text-sm text-gray-600">Bedrooms</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{property.baths}</p>
                <p className="text-sm text-gray-600">Bathrooms</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{property.sqft.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Sq Ft</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Price per Sq Ft:</span>
                <span className="font-semibold">${Math.round(property.price / property.sqft)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days on Market:</span>
                <span className="font-semibold">{property.daysOnMarket || 'N/A'} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property Type:</span>
                <span className="font-semibold">{property.propertyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Year Built:</span>
                <span className="font-semibold">{property.yearBuilt || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lot Size:</span>
                <span className="font-semibold">{property.lotSize ? `${property.lotSize.toLocaleString()} sq ft` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">HOA Fees:</span>
                <span className="font-semibold">${property.hoaFees || 0}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
              </div>
            </div>

            <Card className="bg-green-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Investment Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estimated Rent:</span>
                    <span className="text-sm font-semibold text-green-600">
                      ${Math.round(metrics.estimatedRent).toLocaleString()}/month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly Cash Flow:</span>
                    <span className={`text-sm font-semibold ${metrics.cashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.cashFlow > 0 ? '+' : ''}${Math.round(metrics.cashFlow).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cap Rate:</span>
                    <span className="text-sm font-semibold">{metrics.capRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">GRM (Gross Rent Multiplier):</span>
                    <span className="text-sm font-semibold">{metrics.grm.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">1% Rule:</span>
                    <span className={`text-sm font-semibold ${metrics.onePercentRule >= 1 ? 'text-green-600' : 'text-orange-600'}`}>
                      {metrics.onePercentRule.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex space-x-4 mt-6 pt-6 border-t border-gray-200">
          <Button className="flex-1" onClick={() => alert('Add to comparison functionality would be implemented here')}>
            <Plus className="w-4 h-4 mr-2" />
            Add to Comparison
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleExportProperty}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
