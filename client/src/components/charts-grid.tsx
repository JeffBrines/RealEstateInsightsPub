import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Property } from "@shared/schema";

interface ChartsGridProps {
  data: Property[];
}

export default function ChartsGrid({ data }: ChartsGridProps) {
  const priceChartRef = useRef<HTMLDivElement>(null);
  const domChartRef = useRef<HTMLDivElement>(null);
  const heatmapChartRef = useRef<HTMLDivElement>(null);
  const inventoryChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.length === 0) return;

    // Price Trend Chart
    if (priceChartRef.current) {
      const monthlyData = data
        .filter(p => p.saleDate)
        .reduce((acc, property) => {
          const date = new Date(property.saleDate!);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!acc[monthKey]) acc[monthKey] = [];
          acc[monthKey].push(property.price);
          return acc;
        }, {} as Record<string, number[]>);

      const sortedMonths = Object.keys(monthlyData).sort();
      const medianPrices = sortedMonths.map(month => {
        const prices = monthlyData[month].sort((a, b) => a - b);
        return prices[Math.floor(prices.length / 2)];
      });

      const priceTrace = {
        x: sortedMonths,
        y: medianPrices,
        type: 'scatter' as const,
        mode: 'lines+markers' as const,
        line: { color: '#1976D2' },
        marker: { size: 8 },
        name: 'Median Price'
      };

      Plotly.newPlot(priceChartRef.current, [priceTrace], {
        title: false,
        xaxis: { title: 'Month' },
        yaxis: { title: 'Median Price ($)' },
        margin: { t: 20, r: 20, b: 50, l: 70 },
        showlegend: false,
      }, { responsive: true });
    }

    // Days on Market Histogram
    if (domChartRef.current) {
      const domData = data
        .filter(p => p.daysOnMarket !== undefined)
        .map(p => p.daysOnMarket!);

      const domTrace = {
        x: domData,
        type: 'histogram' as const,
        marker: { color: '#388E3C' },
        name: 'Properties'
      };

      Plotly.newPlot(domChartRef.current, [domTrace], {
        title: false,
        xaxis: { title: 'Days on Market' },
        yaxis: { title: 'Number of Properties' },
        margin: { t: 20, r: 20, b: 50, l: 70 },
        showlegend: false,
      }, { responsive: true });
    }

    // Price per Sq Ft Trends Over Time
    if (heatmapChartRef.current) {
      // Filter properties with valid sale dates and group by month
      const propertiesWithDates = data.filter(p => p.saleDate && p.status === 'C');
      
      const monthlyData = propertiesWithDates.reduce((acc, property) => {
        const saleDate = new Date(property.saleDate!);
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(property.price / property.sqft);
        return acc;
      }, {} as Record<string, number[]>);

      // Calculate monthly averages and sort by date
      const sortedMonths = Object.keys(monthlyData).sort();
      const monthlyAvgPrices = sortedMonths.map(month => {
        const prices = monthlyData[month];
        return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
      });

      const trendTrace = {
        x: sortedMonths.map(m => {
          const [year, month] = m.split('-');
          return `${year}-${month}`;
        }),
        y: monthlyAvgPrices,
        type: 'scatter' as const,
        mode: 'lines+markers',
        line: {
          color: '#2563eb',
          width: 3
        },
        marker: {
          size: 6,
          color: '#2563eb'
        },
        name: 'Avg $/Sq Ft'
      };

      Plotly.newPlot(heatmapChartRef.current, [trendTrace], {
        title: false,
        xaxis: { 
          title: 'Month',
          tickangle: -45
        },
        yaxis: { 
          title: 'Price per Sq Ft ($)',
          tickformat: '$,.0f'
        },
        margin: { t: 20, r: 20, b: 80, l: 80 },
      }, { responsive: true });
    }

    // Inventory Gauge
    if (inventoryChartRef.current) {
      const totalListings = data.filter(p => p.status === 'Active').length;
      const monthlySales = data.filter(p => p.status === 'Sold').length / 12; // Approximate monthly sales
      const monthsOfInventory = monthlySales > 0 ? totalListings / monthlySales : 0;

      const gaugeTrace = {
        type: "indicator" as const,
        mode: "gauge+number",
        value: monthsOfInventory,
        domain: { x: [0, 1], y: [0, 1] },
        title: { text: "Months" },
        gauge: {
          axis: { range: [0, 12] },
          bar: { color: "#1976D2" },
          steps: [
            { range: [0, 3], color: "#4CAF50" },
            { range: [3, 6], color: "#FF9800" },
            { range: [6, 12], color: "#F44336" }
          ],
          threshold: {
            line: { color: "red", width: 4 },
            thickness: 0.75,
            value: 6
          }
        }
      };

      Plotly.newPlot(inventoryChartRef.current, [gaugeTrace], {
        margin: { t: 20, r: 20, b: 20, l: 20 }
      }, { responsive: true });
    }
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Price Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Price Trends</CardTitle>
            <div className="flex space-x-2">
              <Button variant="default" size="sm" className="text-xs px-3 py-1">6M</Button>
              <Button variant="outline" size="sm" className="text-xs px-3 py-1">1Y</Button>
              <Button variant="outline" size="sm" className="text-xs px-3 py-1">2Y</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={priceChartRef} className="h-80" />
        </CardContent>
      </Card>

      {/* Days on Market Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Days on Market Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={domChartRef} className="h-80" />
        </CardContent>
      </Card>

      {/* Price per Sq Ft Time Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price per Sq Ft Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={heatmapChartRef} className="h-80" />
        </CardContent>
      </Card>

      {/* Inventory Gauge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={inventoryChartRef} className="h-80" />
        </CardContent>
      </Card>
    </div>
  );
}
