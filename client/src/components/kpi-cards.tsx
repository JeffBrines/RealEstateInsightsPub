import { Home, Calculator, Clock, Percent, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateKPIs } from "@/lib/kpi-calculator";
import { Property } from "@shared/schema";

interface KPICardsProps {
  data: Property[];
}

export default function KPICards({ data }: KPICardsProps) {
  const kpis = calculateKPIs(data);

  const kpiCards = [
    {
      title: "Median Sale Price",
      value: `$${kpis.medianSalePrice.toLocaleString()}`,
      change: "+12.3%",
      icon: Home,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      trending: "up",
    },
    {
      title: "Price per Sq Ft",
      value: `$${Math.round(kpis.pricePerSqft)}`,
      change: "+8.7%",
      icon: Calculator,
      color: "text-green-500",
      bgColor: "bg-green-50",
      trending: "up",
    },
    {
      title: "Days on Market",
      value: Math.round(kpis.medianDaysOnMarket).toString(),
      change: "-5.2%",
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      trending: "down",
    },
    {
      title: "Sale-to-List Ratio",
      value: `${(kpis.saleToListRatio * 100).toFixed(1)}%`,
      change: "+2.1%",
      icon: Percent,
      color: "text-red-500",
      bgColor: "bg-red-50",
      trending: "up",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiCards.map((kpi) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trending === "up" ? TrendingUp : TrendingDown;
        const trendColor = kpi.trending === "up" ? "text-green-600" : "text-red-600";

        return (
          <Card key={kpi.title} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  <p className={`text-sm flex items-center mt-1 ${trendColor}`}>
                    <TrendIcon className="w-3 h-3 mr-1" />
                    <span>{kpi.change}</span>
                  </p>
                </div>
                <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
