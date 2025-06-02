import { Calendar, MapPin, Home, DollarSign, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FilterState } from "@shared/schema";
import CSVUpload from "./csv-upload";

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  onUploadNew: () => void;
}

export default function FilterSidebar({ 
  filters, 
  onFiltersChange, 
  onReset, 
  onUploadNew 
}: FilterSidebarProps) {
  const handlePriceRangeSelect = (range: string) => {
    const [min, max] = range.split('-').map(v => v === '' ? undefined : parseInt(v));
    onFiltersChange({
      priceRange: { min, max }
    });
  };

  return (
    <aside className="w-80 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset All
          </Button>
        </div>

        {/* Upload New File */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Upload New File</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUploadNew}
              className="w-full"
            >
              Choose Different CSV
            </Button>
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="date-from" className="text-xs">From</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateRange?.from || ""}
                onChange={(e) => onFiltersChange({
                  dateRange: { ...filters.dateRange, from: e.target.value }
                })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="text-xs">To</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateRange?.to || ""}
                onChange={(e) => onFiltersChange({
                  dateRange: { ...filters.dateRange, to: e.target.value }
                })}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Price Range */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Price Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex space-x-2">
              <Input
                placeholder="Min"
                type="number"
                value={filters.priceRange?.min || ""}
                onChange={(e) => onFiltersChange({
                  priceRange: { 
                    ...filters.priceRange, 
                    min: e.target.value ? parseInt(e.target.value) : undefined 
                  }
                })}
                className="text-sm"
              />
              <Input
                placeholder="Max"
                type="number"
                value={filters.priceRange?.max || ""}
                onChange={(e) => onFiltersChange({
                  priceRange: { 
                    ...filters.priceRange, 
                    max: e.target.value ? parseInt(e.target.value) : undefined 
                  }
                })}
                className="text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePriceRangeSelect("0-250000")}
                className="text-xs"
              >
                Under $250k
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePriceRangeSelect("250000-500000")}
                className="text-xs"
              >
                $250k-$500k
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePriceRangeSelect("500000-")}
                className="text-xs"
              >
                $500k+
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="city" className="text-xs">City</Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={filters.location?.city || ""}
                onChange={(e) => onFiltersChange({
                  location: { ...filters.location, city: e.target.value }
                })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="zipcode" className="text-xs">ZIP Code</Label>
              <Input
                id="zipcode"
                placeholder="Enter ZIP code"
                value={filters.location?.zipCode || ""}
                onChange={(e) => onFiltersChange({
                  location: { ...filters.location, zipCode: e.target.value }
                })}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Beds & Baths */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Home className="h-4 w-4 mr-2" />
              Beds & Baths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Beds</Label>
                <Select
                  value={filters.beds?.toString() || ""}
                  onValueChange={(value) => onFiltersChange({
                    beds: value ? parseInt(value) : undefined
                  })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Baths</Label>
                <Select
                  value={filters.baths?.toString() || ""}
                  onValueChange={(value) => onFiltersChange({
                    baths: value ? parseInt(value) : undefined
                  })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Type */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Property Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['Single Family', 'Condo', 'Townhome', 'Multi-Family'].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={filters.propertyTypes?.includes(type) || false}
                  onCheckedChange={(checked) => {
                    const current = filters.propertyTypes || [];
                    const updated = checked
                      ? [...current, type]
                      : current.filter(t => t !== type);
                    onFiltersChange({ propertyTypes: updated });
                  }}
                />
                <Label htmlFor={type} className="text-sm">{type}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={filters.status || "all"}
              onValueChange={(value) => onFiltersChange({
                status: value === "all" ? undefined : value
              })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="text-sm">All Listings</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sold" id="sold" />
                <Label htmlFor="sold" className="text-sm">Sold</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Active" id="active" />
                <Label htmlFor="active" className="text-sm">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Pending" id="pending" />
                <Label htmlFor="pending" className="text-sm">Pending</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
