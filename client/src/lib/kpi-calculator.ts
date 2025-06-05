import { Property, KPIData } from '@shared/schema';

export function calculateKPIs(properties: Property[]): KPIData {
  if (properties.length === 0) {
    return {
      medianSalePrice: 0,
      averageSalePrice: 0,
      medianListPrice: 0,
      averageListPrice: 0,
      saleToListRatio: 0,
      pricePerSqft: 0,
      averageDaysOnMarket: 0,
      medianDaysOnMarket: 0,
      closedSalesCount: 0,
      newListingsCount: 0,
      monthsOfInventory: 0,
      absorptionRate: 0,
      cashVsFinancedRatio: 0,
      totalProperties: 0,
    };
  }

  // Helper function to calculate median
  const median = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };

  // Helper function to calculate average
  const average = (values: number[]): number => {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  // Filter properties for different calculations
  // Handle MLS status codes: C = Closed/Sold, A = Active, etc.
  const soldProperties = properties.filter(p => 
    p.status === 'Sold' || p.status === 'C' || p.status === 'Closed' || p.status === 'SOLD'
  );
  const activeProperties = properties.filter(p => 
    p.status === 'Active' || p.status === 'A' || p.status === 'ACTIVE'
  );
  const propertiesWithDOM = properties.filter(p => p.daysOnMarket !== undefined);

  // Price calculations - use actual sold prices for sold properties
  const prices = properties.map(p => p.price).filter(p => p > 0);
  const salePrices = soldProperties.map(p => p.price).filter(p => p && p > 0); // Use price field which contains sold price for sold properties
  const listPrices = properties.map(p => p.listPrice || p.price).filter(p => p && p > 0);

  // Price per sq ft calculations
  const pricePerSqftValues = properties.map(p => p.price / p.sqft);

  // Days on market calculations
  const domValues = propertiesWithDOM.map(p => p.daysOnMarket!);

  // Sale-to-list ratio calculation
  const saleToListRatios = soldProperties
    .filter(p => p.listPrice && p.salePrice)
    .map(p => (p.salePrice! / p.listPrice!));

  // Monthly calculations for inventory metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const newListingsThisMonth = properties.filter(p => {
    if (!p.listDate) return false;
    const listDate = new Date(p.listDate);
    return listDate.getMonth() === currentMonth && listDate.getFullYear() === currentYear;
  }).length;

  const soldThisMonth = soldProperties.filter(p => {
    if (!p.saleDate) return false;
    const saleDate = new Date(p.saleDate);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  }).length;

  // Calculate months of inventory
  const averageMonthlySales = soldThisMonth || 1; // Avoid division by zero
  const monthsOfInventory = activeProperties.length / averageMonthlySales;

  // Calculate absorption rate (properties sold / total properties)
  const absorptionRate = properties.length > 0 ? (soldProperties.length / properties.length) * 100 : 0;

  return {
    medianSalePrice: median(salePrices),
    averageSalePrice: average(salePrices),
    medianListPrice: median(listPrices),
    averageListPrice: average(listPrices),
    saleToListRatio: average(saleToListRatios),
    pricePerSqft: average(pricePerSqftValues),
    averageDaysOnMarket: average(domValues),
    medianDaysOnMarket: median(domValues),
    closedSalesCount: soldProperties.length,
    newListingsCount: newListingsThisMonth,
    monthsOfInventory,
    absorptionRate,
    cashVsFinancedRatio: 0.75, // This would need additional data to calculate accurately
    totalProperties: properties.length,
  };
}

export function calculateFilteredKPIs(
  allProperties: Property[],
  filteredProperties: Property[]
): { current: KPIData; comparison: KPIData } {
  return {
    current: calculateKPIs(filteredProperties),
    comparison: calculateKPIs(allProperties),
  };
}
