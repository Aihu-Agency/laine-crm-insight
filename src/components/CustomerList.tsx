import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer } from "@/types/airtable";
import { CustomerFiltersValue } from "@/types/filters";
const CustomerList = ({ filters, onCountChange }: { filters: CustomerFiltersValue; onCountChange?: (n: number) => void }) => {
  const navigate = useNavigate();

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => airtableApi.getCustomers(),
  });

  const filteredCustomers = useMemo(() => {
    const list = customers as Customer[];
    const search = (filters.search || "").toLowerCase().trim();
    const location = (filters.location || "").toLowerCase().trim();
    const salesperson = (filters.salesperson || "").toLowerCase().trim();
    const top = (filters.timeOfPurchase || "").toLowerCase().trim();

    return list.filter((customer) => {
      const name = `${customer.firstName || ""} ${customer.lastName || ""}`.toLowerCase();
      if (search && !name.includes(search)) return false;

      if (location) {
        const areas = (customer.areasOfInterest || "").toLowerCase();
        if (!areas.includes(location)) return false;
      }

      if (salesperson) {
        const sp = (customer.salesperson || "").toLowerCase().trim();
        if (sp !== salesperson) return false;
      }

      if (top) {
        const t = (customer.timeOfPurchase || "").toLowerCase().trim();
        if (t !== top) return false;
      }

      return true;
    });
  }, [customers, filters.search, filters.location, filters.salesperson, filters.timeOfPurchase]);

  useEffect(() => {
    onCountChange?.(filteredCustomers.length);
  }, [filteredCustomers.length, onCountChange]);

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


  return (
    <div className="space-y-4">
      {/* Column Headers */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="font-semibold text-gray-700 text-sm text-left">Name</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Location</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Budget</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Time of purchase</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Salesperson</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Actions</div>
      </div>

      {filteredCustomers.map((customer) => (
        <Card key={customer.id} className="hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/customers/${customer.id}`) }}>
          <CardContent className="p-4">
            <div 
              className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center"
            >
               <div className="font-medium text-gray-800">
                 {customer.firstName} {customer.lastName}
               </div>
              
              <div className="text-sm text-gray-600">
                {customer.areasOfInterest || 'Not specified'}
              </div>
              
              <div className="text-sm text-gray-600">
                {customer.minPrice && customer.maxPrice ? `€${customer.minPrice.toLocaleString()} - €${customer.maxPrice.toLocaleString()}` : customer.minPrice ? `€${customer.minPrice.toLocaleString()}+` : customer.maxPrice ? `Up to €${customer.maxPrice.toLocaleString()}` : 'Not specified'}
              </div>

              <div className="text-sm text-gray-600">
                {customer.timeOfPurchase || 'Not specified'}
              </div>
              
              <div className="text-sm text-gray-600">
                {customer.salesperson || 'Unassigned'}
              </div>
              
              <div className="flex justify-start">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); navigate(`/customers/${customer.id}`)}}
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