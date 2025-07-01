
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface Customer {
  id: number;
  fullName: string;
  customerType: "Buyer" | "Renter";
  phase: string;
  location: string;
  budgetRange: string;
  salesperson: string;
  lastContact: string;
}

const CustomerList = () => {
  const customers: Customer[] = [
    {
      id: 1,
      fullName: "Mikko Tuominen",
      customerType: "Buyer",
      phase: "0-3 mo",
      location: "Helsinki",
      budgetRange: "€300k - €400k",
      salesperson: "Laura",
      lastContact: "2 days ago"
    },
    {
      id: 2,
      fullName: "Anna Korhonen",
      customerType: "Renter",
      phase: "3-6 mo",
      location: "Espoo",
      budgetRange: "€1,200 - €1,500/mo",
      salesperson: "Anna",
      lastContact: "1 week ago"
    },
    {
      id: 3,
      fullName: "Petri Hakala",
      customerType: "Buyer",
      phase: "6-12 mo",
      location: "Vantaa",
      budgetRange: "€250k - €350k",
      salesperson: "Mikko",
      lastContact: "3 days ago"
    },
    {
      id: 4,
      fullName: "Sari Laakso",
      customerType: "Buyer",
      phase: "0-3 mo",
      location: "Tampere",
      budgetRange: "€400k - €500k",
      salesperson: "Laura",
      lastContact: "5 days ago"
    },
    {
      id: 5,
      fullName: "Jukka Nieminen",
      customerType: "Renter",
      phase: "3-6 mo",
      location: "Helsinki",
      budgetRange: "€1,000 - €1,300/mo",
      salesperson: "Anna",
      lastContact: "1 day ago"
    },
    {
      id: 6,
      fullName: "Liisa Mäkinen",
      customerType: "Buyer",
      phase: "0-3 mo",
      location: "Turku",
      budgetRange: "€200k - €300k",
      salesperson: "Sari",
      lastContact: "4 days ago"
    },
    {
      id: 7,
      fullName: "Tero Jokinen",
      customerType: "Renter",
      phase: "6-12 mo",
      location: "Espoo",
      budgetRange: "€1,500 - €1,800/mo",
      salesperson: "Mikko",
      lastContact: "2 weeks ago"
    },
    {
      id: 8,
      fullName: "Kirsi Salonen",
      customerType: "Buyer",
      phase: "3-6 mo",
      location: "Helsinki",
      budgetRange: "€350k - €450k",
      salesperson: "Laura",
      lastContact: "6 days ago"
    },
    {
      id: 9,
      fullName: "Ville Heikkinen",
      customerType: "Renter",
      phase: "0-3 mo",
      location: "Vantaa",
      budgetRange: "€900 - €1,200/mo",
      salesperson: "Anna",
      lastContact: "3 days ago"
    },
    {
      id: 10,
      fullName: "Marja Virtanen",
      customerType: "Buyer",
      phase: "12+ mo",
      location: "Tampere",
      budgetRange: "€500k - €600k",
      salesperson: "Sari",
      lastContact: "1 month ago"
    },
    {
      id: 11,
      fullName: "Markus Rantala",
      customerType: "Buyer",
      phase: "0-3 mo",
      location: "Helsinki",
      budgetRange: "€280k - €380k",
      salesperson: "Laura",
      lastContact: "1 week ago"
    },
    {
      id: 12,
      fullName: "Tiina Källi",
      customerType: "Renter",
      phase: "3-6 mo",
      location: "Espoo",
      budgetRange: "€1,100 - €1,400/mo",
      salesperson: "Mikko",
      lastContact: "5 days ago"
    },
    {
      id: 13,
      fullName: "Otso Lindfors",
      customerType: "Buyer",
      phase: "6-12 mo",
      location: "Turku",
      budgetRange: "€320k - €420k",
      salesperson: "Anna",
      lastContact: "2 weeks ago"
    },
    {
      id: 14,
      fullName: "Tommi Perälä",
      customerType: "Renter",
      phase: "0-3 mo",
      location: "Helsinki",
      budgetRange: "€1,300 - €1,600/mo",
      salesperson: "Sari",
      lastContact: "4 days ago"
    },
    {
      id: 15,
      fullName: "Elina Koskinen",
      customerType: "Buyer",
      phase: "3-6 mo",
      location: "Vantaa",
      budgetRange: "€250k - €350k",
      salesperson: "Laura",
      lastContact: "1 week ago"
    }
  ];

  const getCustomerTypeColor = (type: "Buyer" | "Renter") => {
    return type === "Buyer" ? "bg-laine-mint text-gray-800" : "bg-laine-blue text-gray-800";
  };

  const getPhaseColor = (phase: string) => {
    if (phase.includes("0-3")) return "bg-red-50 text-red-700 border-red-200";
    if (phase.includes("3-6")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (phase.includes("6-12")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-4">
      {customers.map((customer) => (
        <Card key={customer.id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                <div className="font-medium text-gray-800">
                  {customer.fullName}
                </div>
                
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCustomerTypeColor(customer.customerType)}`}>
                    {customer.customerType}
                  </span>
                </div>
                
                <div>
                  <span className={`px-2 py-1 rounded border text-xs font-medium ${getPhaseColor(customer.phase)}`}>
                    {customer.phase}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {customer.location}
                </div>
                
                <div className="text-sm text-gray-600">
                  {customer.budgetRange}
                </div>
                
                <div className="text-sm text-gray-600">
                  {customer.salesperson}
                </div>
                
                <div className="text-sm text-gray-500">
                  {customer.lastContact}
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="ml-4">
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CustomerList;
