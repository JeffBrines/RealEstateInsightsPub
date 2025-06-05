import Papa from 'papaparse';
import { Property, ColumnMapping } from '@shared/schema';

export interface ProcessedCSV {
  data: Property[];
  columnMapping: ColumnMapping;
  errors: string[];
}

// Common column name patterns for auto-detection
const COLUMN_PATTERNS = {
  address: /^(address|addr|street|property_address|full_address|location|property_location)$/i,
  city: /^(city|municipality|town)$/i,
  state: /^(state|st|province)$/i,
  zipCode: /^(zip|zipcode|zip_code|postal|postal_code|zip code)$/i,
  price: /^(price|list_price|asking_price|current_price|sale_price|sold_price|listing_price|sold price|listing price|orig\. list price)$/i,
  listPrice: /^(list_price|listing_price|asking_price|original_price|orig\. list price|listing price)$/i,
  salePrice: /^(sale_price|sold_price|final_price|closing_price|sold price)$/i,
  beds: /^(beds|bedrooms|bed|br|bedroom|total bedrooms|overall bedrooms|overall total bedrooms)$/i,
  baths: /^(baths|bathrooms|bath|ba|full_baths|bathroom|total baths|overall total baths)$/i,
  sqft: /^(sqft|sq_ft|square_feet|living_area|floor_area|size|sq\.ft|living_sqft|main house sqft|total sqft)$/i,
  lotSize: /^(lot_size|lot_sqft|lot_area|land_area|lot|lot size|acres)$/i,
  yearBuilt: /^(year_built|year|built|construction_year|yr_built|year built)$/i,
  propertyType: /^(property_type|type|style|home_type|prop_type|property type|house style|realtor\.com type)$/i,
  status: /^(status|listing_status|mls_status|property_status)$/i,
  daysOnMarket: /^(days_on_market|dom|market_days|days_market|days on market)$/i,
  listDate: /^(list_date|listing_date|date_listed|listed_date|effective date)$/i,
  saleDate: /^(sale_date|sold_date|closing_date|date_sold|close_date|sold date)$/i,
  hoaFees: /^(hoa|hoa_fee|hoa_fees|association_fee|hoa_monthly)$/i,
};

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  // First pass: exact matches for MLS-specific columns
  const exactMatches: Record<string, string> = {
    'Overall Total Bedrooms': 'beds',
    'Overall Total Baths': 'baths', 
    'Main House SqFt': 'sqft',
    'Sold Price': 'price',
    'Listing Price': 'listPrice',
    'Orig. List Price': 'listPrice',
    'Sold Date': 'saleDate',
    'Effective Date': 'listDate',
    'Status': 'status',
    'Days on Market': 'daysOnMarket',
    'Realtor.com Type': 'propertyType',
    'Street': 'address',
    'City': 'city',
    'State': 'state',
    'Zip Code': 'zipCode',
    'Year Built': 'yearBuilt',
    'Acres': 'lotSize'
  };

  // Apply exact matches first
  for (const header of headers) {
    if (exactMatches[header]) {
      mapping[exactMatches[header] as keyof ColumnMapping] = header;
    }
  }
  
  // Second pass: pattern matching for any remaining unmapped fields
  headers.forEach(header => {
    const cleanHeader = header.trim().toLowerCase();
    
    for (const [field, pattern] of Object.entries(COLUMN_PATTERNS)) {
      if (!mapping[field as keyof ColumnMapping] && pattern.test(cleanHeader)) {
        mapping[field as keyof ColumnMapping] = header;
        break;
      }
    }
  });
  
  console.log('Column mapping:', mapping); // Debug log
  return mapping;
}

export function cleanValue(value: string, type: 'number' | 'string' | 'date'): any {
  if (!value || value.trim() === '') return undefined;
  
  const cleanedValue = value.trim();
  
  switch (type) {
    case 'number':
      // Remove currency symbols, commas, and other non-numeric characters
      const numericValue = cleanedValue.replace(/[$,\s]/g, '');
      const parsed = parseFloat(numericValue);
      return isNaN(parsed) ? undefined : parsed;
      
    case 'date':
      // Try to parse various date formats
      const date = new Date(cleanedValue);
      return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0];
      
    case 'string':
    default:
      return cleanedValue;
  }
}

export function transformRow(row: any, mapping: ColumnMapping): Property | null {
  try {
    // Extract basic data with fallbacks
    const address = row[mapping.address || ''] || row[mapping.city || ''] || 'Unknown Address';
    const city = row[mapping.city || ''] || 'Unknown City';
    
    // Price fields - use any available price
    let price = cleanValue(row[mapping.price || ''], 'number') ||
                cleanValue(row[mapping.salePrice || ''], 'number') ||
                cleanValue(row[mapping.listPrice || ''], 'number');
    
    // Basic property details with defaults
    const beds = cleanValue(row[mapping.beds || ''], 'number') || 0;
    const baths = cleanValue(row[mapping.baths || ''], 'number') || 0;
    const sqft = cleanValue(row[mapping.sqft || ''], 'number') || 1000; // Default to avoid division by zero
    const propertyType = cleanValue(row[mapping.propertyType || ''], 'string') || 'Single Family';
    const status = cleanValue(row[mapping.status || ''], 'string') || 'Unknown';
    
    // Skip rows without any price data
    if (!price || price <= 0) {
      return null;
    }
    
    const property: Property = {
      id: Math.random().toString(36).substr(2, 9),
      address: address.trim(),
      city: city.trim(),
      state: cleanValue(row[mapping.state || ''], 'string'),
      zipCode: cleanValue(row[mapping.zipCode || ''], 'string'),
      price,
      listPrice: cleanValue(row[mapping.listPrice || ''], 'number'),
      salePrice: cleanValue(row[mapping.salePrice || ''], 'number'),
      beds,
      baths,
      sqft,
      lotSize: cleanValue(row[mapping.lotSize || ''], 'number'),
      yearBuilt: cleanValue(row[mapping.yearBuilt || ''], 'number'),
      propertyType: propertyType || 'Unknown',
      status: status || 'Unknown',
      daysOnMarket: cleanValue(row[mapping.daysOnMarket || ''], 'number'),
      listDate: cleanValue(row[mapping.listDate || ''], 'date'),
      saleDate: cleanValue(row[mapping.saleDate || ''], 'date'),
      hoaFees: cleanValue(row[mapping.hoaFees || ''], 'number'),
    };
    
    return property;
  } catch (error) {
    console.error('Error transforming row:', error);
    return null;
  }
}

export function processCSV(file: File): Promise<ProcessedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (result) => {
        try {
          if (!result.data || result.data.length === 0) {
            reject(new Error('CSV file appears to be empty or corrupted'));
            return;
          }

          const headers = Object.keys(result.data[0] || {});
          console.log('Detected headers:', headers); // Debug log
          
          const columnMapping = detectColumnMapping(headers);
          console.log('Column mapping:', columnMapping); // Debug log
          
          const errors: string[] = [];
          
          // Check if we have minimum required data for real estate analysis
          const hasAddress = columnMapping.address || columnMapping.city;
          const hasPrice = columnMapping.price || columnMapping.listPrice || columnMapping.salePrice;
          const hasSize = columnMapping.sqft || columnMapping.lotSize;
          
          if (!hasAddress) {
            errors.push('Could not detect address or location columns.');
          }
          if (!hasPrice) {
            errors.push('Could not detect price columns (list price, sale price, etc.).');
          }
          if (!hasSize) {
            errors.push('Could not detect size information (square feet, lot size, etc.).');
          }
          
          const transformedData: Property[] = [];
          
          result.data.forEach((row: any, index: number) => {
            try {
              const property = transformRow(row, columnMapping);
              if (property) {
                transformedData.push(property);
              }
            } catch (rowError) {
              if (index < 5) { // Only log first 5 row errors
                errors.push(`Row ${index + 1}: ${rowError instanceof Error ? rowError.message : 'Invalid data'}`);
              }
            }
          });
          
          if (transformedData.length === 0) {
            reject(new Error('No valid property records found. Please check your CSV format and required columns.'));
            return;
          }
          
          resolve({
            data: transformedData,
            columnMapping,
            errors
          });
        } catch (error) {
          reject(new Error(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      },
      error: (error: any) => {
        reject(new Error(`Failed to parse CSV file: ${error.message}. The file may be corrupted or have encoding issues.`));
      }
    });
  });
}
