import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer } from "@/types/airtable";

const CustomerList = () => {
  const navigate = useNavigate();

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => airtableApi.getCustomers(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading customers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-600">Error loading customers. Please try again.</div>
      </div>
    );
  }

  const getPhaseColor = (phase: string) => {
    if (phase.includes("0-3")) return "bg-red-50 text-red-700 border-red-200";
    if (phase.includes("3-6")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (phase.includes("6-12")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-4">
      {/* Column Headers */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="font-semibold text-gray-700 text-sm text-left">Name</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Phase</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Location</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Budget</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Salesperson</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Last Contacted</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Actions</div>
      </div>

      {customers.map((customer) => (
        <Card key={customer.id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
               <div className="font-medium text-gray-800">
                 {customer.firstName} {customer.lastName}
               </div>
              
              <div>
                <span className={`px-2 py-1 rounded border text-xs font-medium ${getPhaseColor(customer.phase)}`}>
                  {customer.phase}
                </span>
              </div>
              
               <div className="text-sm text-gray-600">
                 {customer.areasOfInterest || 'Not specified'}
               </div>
              
               <div className="text-sm text-gray-600">
                 {customer.minPrice && customer.maxPrice ? `€${customer.minPrice.toLocaleString()} - €${customer.maxPrice.toLocaleString()}` : customer.minPrice ? `€${customer.minPrice.toLocaleString()}+` : customer.maxPrice ? `Up to €${customer.maxPrice.toLocaleString()}` : 'Not specified'}
               </div>
              
               <div className="text-sm text-gray-600">
                 {customer.salesperson || 'Unassigned'}
               </div>
              
               <div className="text-sm text-gray-500">
                 {customer.lastContact || 'No contact recorded'}
               </div>
              
              <div className="flex justify-start">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CustomerList;