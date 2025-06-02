import { useState } from "react";
import { Download, Eye, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Property } from "@shared/schema";

interface PropertyTableProps {
  data: Property[];
  onPropertySelect: (property: Property) => void;
}

type SortField = keyof Property;
type SortDirection = 'asc' | 'desc';

export default function PropertyTable({ data, onPropertySelect }: PropertyTableProps) {
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedData.length / pageSize);

  const exportToCSV = () => {
    const headers = ['Address', 'City', 'Price', 'Beds', 'Baths', 'Sq Ft', 'Price/Sq Ft', 'DOM', 'Status'];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(property => [
        `"${property.address}"`,
        `"${property.city}"`,
        property.price,
        property.beds,
        property.baths,
        property.sqft,
        Math.round(property.price / property.sqft),
        property.daysOnMarket || '',
        property.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'filtered_properties.csv';
    link.click();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Sold': return 'default';
      case 'Active': return 'secondary';
      case 'Pending': return 'outline';
      default: return 'outline';
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-gray-100"
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Property Listings</CardTitle>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} properties
            </span>
            <Button onClick={exportToCSV} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="address">Address</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="price">Price</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="beds">Beds</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="baths">Baths</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="sqft">Sq Ft</SortButton>
                </TableHead>
                <TableHead>$/Sq Ft</TableHead>
                <TableHead>
                  <SortButton field="daysOnMarket">DOM</SortButton>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((property) => (
                <TableRow
                  key={property.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onPropertySelect(property)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-md flex-shrink-0"></div>
                      <div>
                        <div className="font-medium text-gray-900">{property.address}</div>
                        <div className="text-sm text-gray-500">{property.city}, {property.state} {property.zipCode}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${property.price.toLocaleString()}
                  </TableCell>
                  <TableCell>{property.beds}</TableCell>
                  <TableCell>{property.baths}</TableCell>
                  <TableCell>{property.sqft.toLocaleString()}</TableCell>
                  <TableCell>${Math.round(property.price / property.sqft)}</TableCell>
                  <TableCell>{property.daysOnMarket || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(property.status)}>
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPropertySelect(property);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
