
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "./Navigation";

interface DashboardProps {
  onLogout?: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [showMoreActions, setShowMoreActions] = useState(false);

  const initialActionRequiredCustomers = [
    {
      name: "Mikko Tuominen",
      action: "Call 14.7.2025",
      priority: "high" as const
    },
    {
      name: "Otso Lindfors", 
      action: "Email 15.7.2025",
      priority: "medium" as const
    },
    {
      name: "Tiina Källi",
      action: "Contact in July",
      priority: "low" as const
    },
    {
      name: "Tommi Perälä",
      action: "Call 14.7.2025 at 13:00",
      priority: "high" as const
    },
    {
      name: "Tiina Källi",
      action: "Not contacted in 3 months",
      priority: "medium" as const
    }
  ];

  const additionalActionRequiredCustomers = [
    {
      name: "Marja Virtanen",
      action: "Schedule meeting 16.7.2025",
      priority: "high" as const
    },
    {
      name: "Jukka Nieminen",
      action: "Send property list",
      priority: "medium" as const
    },
    {
      name: "Anna Korhonen",
      action: "Follow up on proposal",
      priority: "high" as const
    },
    {
      name: "Petri Hakala",
      action: "Call 17.7.2025",
      priority: "low" as const
    },
    {
      name: "Sari Laakso",
      action: "Email property details",
      priority: "medium" as const
    },
    {
      name: "Markus Rantala",
      action: "Schedule viewing",
      priority: "high" as const
    },
    {
      name: "Liisa Mäkinen",
      action: "Not contacted in 2 months",
      priority: "medium" as const
    },
    {
      name: "Tero Jokinen",
      action: "Call 18.7.2025 at 10:00",
      priority: "low" as const
    },
    {
      name: "Kirsi Salonen",
      action: "Send contract draft",
      priority: "high" as const
    },
    {
      name: "Ville Heikkinen",
      action: "Follow up on financing",
      priority: "medium" as const
    }
  ];

  const newProperties = [
    {
      name: "Mikko Tuominen",
      count: "2 new properties"
    },
    {
      name: "Otso Lindfors",
      count: "2 new properties"
    },
    {
      name: "Tiina Källi",
      count: "1 new properties"
    },
    {
      name: "Tommi Perälä",
      count: "1 new properties"
    }
  ];

  const actionRequiredCustomers = showMoreActions 
    ? [...initialActionRequiredCustomers, ...additionalActionRequiredCustomers]
    : initialActionRequiredCustomers;

  const handleShowMore = () => {
    setShowMoreActions(true);
  };

  const getPriorityStyles = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-l-4 border-red-400';
      case 'medium':
        return 'bg-yellow-50 border-l-4 border-yellow-400';
      case 'low':
        return 'bg-laine-blue border-l-4 border-blue-400';
      default:
        return 'bg-laine-blue border-l-4 border-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 70% */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI-suggested properties section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  New properties available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {newProperties.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center py-3 px-4 bg-laine-beige rounded-lg hover:bg-laine-beige/80 transition-colors duration-200 cursor-pointer"
                    >
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="text-sm text-gray-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customers needing action */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Action required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actionRequiredCustomers.map((customer, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center py-3 px-4 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.01] ${getPriorityStyles(customer.priority)}`}
                    >
                      <span className="font-medium text-gray-800">{customer.name}</span>
                      <span className="text-sm text-gray-600">{customer.action}</span>
                    </div>
                  ))}
                </div>
                {!showMoreActions && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      className="text-primary border-primary hover:bg-primary/10"
                      onClick={handleShowMore}
                    >
                      Show more
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 30% */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 mb-4">
                  Add new customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-firstname">Customer First Name</Label>
                  <Input 
                    id="customer-firstname" 
                    placeholder="Enter first name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-lastname">Customer Last Name</Label>
                  <Input 
                    id="customer-lastname" 
                    placeholder="Enter last name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area-interest">Area of interest</Label>
                  <Input 
                    id="area-interest" 
                    placeholder="Enter area"
                    className="w-full"
                  />
                </div>
                <Button className="w-full bg-laine-mint hover:bg-laine-mint/90 text-gray-800 border-0">
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
