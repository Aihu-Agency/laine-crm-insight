
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface Customer {
  id: number;
  fullName: string;
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
      phase: "0-3 mo",
      location: "Marbella",
      budgetRange: "€300k - €400k",
      salesperson: "Laura",
      lastContact: "2 days ago"
    },
    {
      id: 2,
      fullName: "Anna Korhonen",
      phase: "3-6 mo",
      location: "Estepona",
      budgetRange: "€250k - €350k",
      salesperson: "Anna",
      lastContact: "1 week ago"
    },
    {
      id: 3,
      fullName: "Petri Hakala",
      phase: "6-12 mo",
      location: "Fuengirola",
      budgetRange: "€200k - €300k",
      salesperson: "Mikko",
      lastContact: "3 days ago"
    },
    {
      id: 4,
      fullName: "Sari Laakso",
      phase: "0-3 mo",
      location: "Torremolinos",
      budgetRange: "€400k - €500k",
      salesperson: "Laura",
      lastContact: "5 days ago"
    },
    {
      id: 5,
      fullName: "Jukka Nieminen",
      phase: "3-6 mo",
      location: "Marbella",
      budgetRange: "€350k - €450k",
      salesperson: "Anna",
      lastContact: "1 day ago"
    },
    {
      id: 6,
      fullName: "Liisa Mäkinen",
      phase: "0-3 mo",
      location: "Benalmádena",
      budgetRange: "€180k - €280k",
      salesperson: "Sari",
      lastContact: "4 days ago"
    },
    {
      id: 7,
      fullName: "Tero Jokinen",
      phase: "6-12 mo",
      location: "Mijas",
      budgetRange: "€500k - €600k",
      salesperson: "Mikko",
      lastContact: "2 weeks ago"
    },
    {
      id: 8,
      fullName: "Kirsi Salonen",
      phase: "3-6 mo",
      location: "Marbella",
      budgetRange: "€320k - €420k",
      salesperson: "Laura",
      lastContact: "6 days ago"
    },
    {
      id: 9,
      fullName: "Ville Heikkinen",
      phase: "0-3 mo",
      location: "Estepona",
      budgetRange: "€280k - €380k",
      salesperson: "Anna",
      lastContact: "3 days ago"
    },
    {
      id: 10,
      fullName: "Marja Virtanen",
      phase: "12+ mo",
      location: "Fuengirola",
      budgetRange: "€450k - €550k",
      salesperson: "Sari",
      lastContact: "1 month ago"
    },
    {
      id: 11,
      fullName: "Markus Rantala",
      phase: "0-3 mo",
      location: "Torremolinos",
      budgetRange: "€300k - €400k",
      salesperson: "Laura",
      lastContact: "1 week ago"
    },
    {
      id: 12,
      fullName: "Tiina Källi",
      phase: "3-6 mo",
      location: "Mijas",
      budgetRange: "€380k - €480k",
      salesperson: "Mikko",
      lastContact: "5 days ago"
    },
    {
      id: 13,
      fullName: "Otso Lindfors",
      phase: "6-12 mo",
      location: "Benalmádena",
      budgetRange: "€220k - €320k",
      salesperson: "Anna",
      lastContact: "2 weeks ago"
    },
    {
      id: 14,
      fullName: "Tommi Perälä",
      phase: "0-3 mo",
      location: "Marbella",
      budgetRange: "€600k - €700k",
      salesperson: "Sari",
      lastContact: "4 days ago"
    },
    {
      id: 15,
      fullName: "Elina Koskinen",
      phase: "3-6 mo",
      location: "Estepona",
      budgetRange: "€250k - €350k",
      salesperson: "Laura",
      lastContact: "1 week ago"
    }
  ];

  const getPhaseColor = (phase: string) => {
    if (phase.includes("0-3")) return "bg-red-50 text-red-700 border-red-200";
    if (phase.includes("3-6")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (phase.includes("6-12")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-4">
      {/* Column Headers */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="font-semibold text-gray-700 text-sm text-left">Name</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Phase</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Location</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Budget</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Salesperson</div>
        <div className="font-semibold text-gray-700 text-sm text-left">Last Contacted</div>
      </div>

      {customers.map((customer) => (
        <Card key={customer.id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div className="font-medium text-gray-800">
                  {customer.fullName}
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
