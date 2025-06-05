import { z } from "zod";

// Property data schema for CSV rows
export const propertySchema = z.object({
  id: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  price: z.number(),
  listPrice: z.number().optional(),
  salePrice: z.number().optional(),
  beds: z.number(),
  baths: z.number(),
  sqft: z.number(),
  lotSize: z.number().optional(),
  yearBuilt: z.number().optional(),
  propertyType: z.string(),
  status: z.enum(["Active", "Sold", "Pending", "Withdrawn", "C", "A", "SOLD", "Closed", "ACTIVE"]),
  daysOnMarket: z.number().optional(),
  listDate: z.string().optional(),
  saleDate: z.string().optional(),
  hoaFees: z.number().optional(),
  estimatedRent: z.number().optional(),
  photoUrls: z.array(z.string()).optional(),
});

export type Property = z.infer<typeof propertySchema>;

// Filter schema
export const filterSchema = z.object({
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  location: z.object({
    city: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  beds: z.number().optional(),
  baths: z.number().optional(),
  propertyTypes: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export type FilterState = z.infer<typeof filterSchema>;

// KPI schema
export const kpiSchema = z.object({
  medianSalePrice: z.number(),
  averageSalePrice: z.number(),
  medianListPrice: z.number(),
  averageListPrice: z.number(),
  saleToListRatio: z.number(),
  pricePerSqft: z.number(),
  averageDaysOnMarket: z.number(),
  medianDaysOnMarket: z.number(),
  closedSalesCount: z.number(),
  newListingsCount: z.number(),
  monthsOfInventory: z.number(),
  absorptionRate: z.number(),
  cashVsFinancedRatio: z.number(),
  totalProperties: z.number(),
});

export type KPIData = z.infer<typeof kpiSchema>;

// AI query schema
export const aiQuerySchema = z.object({
  query: z.string(),
  data: z.array(propertySchema),
  filters: filterSchema.optional(),
});

export type AIQuery = z.infer<typeof aiQuerySchema>;

// AI response schema
export const aiResponseSchema = z.object({
  answer: z.string(),
  data: z.record(z.any()).optional(),
  chartData: z.any().optional(),
  filters: filterSchema.optional(),
});

export type AIResponse = z.infer<typeof aiResponseSchema>;

// Column mapping schema for CSV import
export const columnMappingSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  price: z.string().optional(),
  listPrice: z.string().optional(),
  salePrice: z.string().optional(),
  beds: z.string().optional(),
  baths: z.string().optional(),
  sqft: z.string().optional(),
  lotSize: z.string().optional(),
  yearBuilt: z.string().optional(),
  propertyType: z.string().optional(),
  status: z.string().optional(),
  daysOnMarket: z.string().optional(),
  listDate: z.string().optional(),
  saleDate: z.string().optional(),
  hoaFees: z.string().optional(),
});

export type ColumnMapping = z.infer<typeof columnMappingSchema>;
