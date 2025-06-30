
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import Navigation from "./Navigation";

const Dashboard = () => {
  const actionRequiredCustomers = [
    {
      name: "Mikko Tuominen",
      action: "Call 14.7.2025",
      priority: "high"
    },
    {
      name: "Otso Lindfors", 
      action: "Email 15.7.2025",
      priority: "medium"
    },
    {
      name: "Tiina Källi",
      action: "Contact in July",
      priority: "low"
    },
    {
      name: "Tommi Perälä",
      action: "Call 14.7.2025 at 13:00",
      priority: "high"
    },
    {
      name: "Tiina Källi",
      action: "Not contacted in 3 months",
      priority: "medium"
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

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation />
      
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
                    <div key={index} className="flex justify-between items-center py-3 px-4 bg-laine-beige rounded-lg">
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
                      className={`flex justify-between items-center py-3 px-4 rounded-lg ${
                        customer.priority === 'high' 
                          ? 'bg-red-50 border-l-4 border-red-400' 
                          : customer.priority === 'medium'
                          ? 'bg-yellow-50 border-l-4 border-yellow-400'
                          : 'bg-laine-blue border-l-4 border-blue-400'
                      }`}
                    >
                      <span className="font-medium text-gray-800">{customer.name}</span>
                      <span className="text-sm text-gray-600">{customer.action}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                    + Show more
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 30% */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add new customer
                </Button>
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
