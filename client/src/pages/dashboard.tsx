import { useState } from "react";
import { ChartLine, Settings, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CSVUpload from "@/components/csv-upload";
import FilterSidebar from "@/components/filter-sidebar";
import KPICards from "@/components/kpi-cards";
import ChartsGrid from "@/components/charts-grid";
import PropertyTable from "@/components/property-table";
import AIChat from "@/components/ai-chat";
import EnhancedPropertyModal from "@/components/enhanced-property-modal";
import MarketInsights from "@/components/market-insights";
import ComparableAnalysis from "@/components/comparable-analysis";

import { useCSVData } from "@/hooks/use-csv-data";
import { useFilters } from "@/hooks/use-filters";
import { Property } from "@shared/schema";

export default function Dashboard() {
  const { data, isLoading, fileName, rowCount, uploadCSV, resetData } = useCSVData();
  const { filters, updateFilters, resetFilters, filteredData } = useFilters(data || []);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'comparables'>('overview');

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleClosePropertyModal = () => {
    setSelectedProperty(null);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <ChartLine className="text-primary text-2xl" />
                <h1 className="text-xl font-semibold text-gray-900">Real Estate Analytics</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Upload Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <ChartLine className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Real Estate Analytics
              </h2>
              <p className="text-gray-600">
                Upload your CSV file to start analyzing real estate data with interactive dashboards and AI insights.
              </p>
            </div>
            <CSVUpload onUpload={uploadCSV} isLoading={isLoading} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <ChartLine className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-gray-900">Real Estate Analytics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{fileName}</span>
              <Badge variant="secondary" className="bg-green-500 text-white">
                {rowCount?.toLocaleString()} properties
              </Badge>
              <div className="flex space-x-1">
                <Button 
                  variant={activeTab === 'overview' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </Button>
                <Button 
                  variant={activeTab === 'insights' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('insights')}
                >
                  Market Insights
                </Button>
                <Button 
                  variant={activeTab === 'comparables' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('comparables')}
                >
                  CMA Tool
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={resetData}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <FilterSidebar
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
          onUploadNew={resetData}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {activeTab === 'overview' && (
                <>
                  {/* KPI Cards */}
                  <KPICards data={filteredData} />

                  {/* Charts */}
                  <ChartsGrid data={filteredData} />

                  {/* Property Table */}
                  <PropertyTable
                    data={filteredData}
                    onPropertySelect={handlePropertySelect}
                  />
                </>
              )}

              {activeTab === 'insights' && (
                <MarketInsights data={filteredData} />
              )}

              {activeTab === 'comparables' && (
                <ComparableAnalysis data={data || []} />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* AI Chat FAB */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-50"
        onClick={() => setIsAIChatOpen(true)}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10h8c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8v6h-8z"/>
          <circle cx="9" cy="12" r="1"/>
          <circle cx="15" cy="12" r="1"/>
          <path d="M8 15c0 2.21 1.79 4 4 4s4-1.79 4-4"/>
        </svg>
      </Button>

      {/* AI Chat Modal */}
      <AIChat
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        data={filteredData}
        filters={filters}
      />

      {/* Property Detail Modal */}
      <EnhancedPropertyModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
        allProperties={data || []}
      />
    </div>
  );
}
