import { useState, useMemo } from 'react';
import { Property, FilterState } from '@shared/schema';

export function useFilters(data: Property[]) {
  const [filters, setFilters] = useState<FilterState>({});

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  const filteredData = useMemo(() => {
    if (!data.length) return [];

    return data.filter(property => {
      // Date range filter
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const propertyDate = property.saleDate || property.listDate;
        if (!propertyDate) return false;
        
        if (filters.dateRange.from && propertyDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && propertyDate > filters.dateRange.to) return false;
      }

      // Price range filter
      if (filters.priceRange?.min && property.price < filters.priceRange.min) return false;
      if (filters.priceRange?.max && property.price > filters.priceRange.max) return false;

      // Location filter
      if (filters.location?.city && !property.city.toLowerCase().includes(filters.location.city.toLowerCase())) {
        return false;
      }
      if (filters.location?.zipCode && property.zipCode !== filters.location.zipCode) {
        return false;
      }

      // Beds filter
      if (filters.beds && property.beds < filters.beds) return false;

      // Baths filter
      if (filters.baths && property.baths < filters.baths) return false;

      // Property type filter
      if (filters.propertyTypes?.length && !filters.propertyTypes.includes(property.propertyType)) {
        return false;
      }

      // Status filter
      if (filters.status && property.status !== filters.status) return false;

      return true;
    });
  }, [data, filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    filteredData,
  };
}
