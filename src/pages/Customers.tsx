
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Customer {
  id: number;
  fullName: string;
  customerType: string;
  phase: string;
  location: string;
  budgetRange: string;
  salesperson: string;
  lastContact: string;
}

const dummyCustomers: Customer[] = [
  {
    id: 1,
    fullName: "John Smith",
    customerType: "Buyer",
    phase: "0-3 mo",
    location: "Barcelona",
    budgetRange: "€500K - €700K",
    salesperson: "Laura",
    lastContact: "2 days ago"
  },
  {
    id: 2,
    fullName: "Maria Garcia",
    customerType: "Investor",
    phase: "3-6 mo",
    location: "Madrid",
    budgetRange: "€800K - €1.2M",
    salesperson: "Anna",
    lastContact: "1 week ago"
  },
  {
    id: 3,
    fullName: "David Johnson",
    customerType: "Holiday home",
    phase: "0-3 mo",
    location: "Valencia",
    budgetRange: "€300K - €450K",
    salesperson: "Laura",
    lastContact: "3 days ago"
  },
  {
    id: 4,
    fullName: "Sarah Wilson",
    customerType: "Renter",
    phase: "6+ mo",
    location: "Sevilla",
    budgetRange: "€2K - €3K/month",
    salesperson: "Anna",
    lastContact: "5 days ago"
  },
  {
    id: 5,
    fullName: "Michael Brown",
    customerType: "Buyer",
    phase: "3-6 mo",
    location: "Barcelona",
    budgetRange: "€1M - €1.5M",
    salesperson: "Laura",
    lastContact: "1 day ago"
  },
  {
    id: 6,
    fullName: "Elena Rodriguez",
    customerType: "Investor",
    phase: "0-3 mo",
    location: "Bilbao",
    budgetRange: "€600K - €900K",
    salesperson: "Anna",
    lastContact: "4 days ago"
  },
  {
    id: 7,
    fullName: "Thomas Mueller",
    customerType: "Holiday home",
    phase: "3-6 mo",
    location: "Málaga",
    budgetRange: "€400K - €550K",
    salesperson: "Laura",
    lastContact: "1 week ago"
  },
  {
    id: 8,
    fullName: "Lisa Anderson",
    customerType: "Buyer",
    phase: "0-3 mo",
    location: "Madrid",
    budgetRange: "€750K - €1M",
    salesperson: "Anna",
    lastContact: "2 days ago"
  }
];

interface CustomersProps {
  onLogout?: () => void;
}

const Customers = ({ onLogout }: CustomersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [selectedCustomerType, setSelectedCustomerType] = useState("");
  const [selectedSalesperson, setSelectedSalesperson] = useState("");

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPhase("");
    setSelectedLocation("");
    setMinBudget("");
    setMaxBudget("");
    setSelectedCustomerType("");
    setSelectedSalesperson("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onLogout={onLogout} />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Customers</h1>
          
          {/* Filter Controls */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Filter & Search</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search by name</label>
                  <Input
                    placeholder="Enter customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
                  <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-3-mo">0-3 months</SelectItem>
                      <SelectItem value="3-6-mo">3-6 months</SelectItem>
                      <SelectItem value="6-mo-plus">6+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barcelona">Barcelona</SelectItem>
                      <SelectItem value="madrid">Madrid</SelectItem>
                      <SelectItem value="valencia">Valencia</SelectItem>
                      <SelectItem value="sevilla">Sevilla</SelectItem>
                      <SelectItem value="bilbao">Bilbao</SelectItem>
                      <SelectItem value="malaga">Málaga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                  <Select value={selectedCustomerType} onValueChange={setSelectedCustomerType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="renter">Renter</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                      <SelectItem value="holiday-home">Holiday home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget</label>
                  <Input
                    type="number"
                    placeholder="Min budget..."
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget</label>
                  <Input
                    type="number"
                    placeholder="Max budget..."
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salesperson</label>
                  <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select salesperson" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laura">Laura</SelectItem>
                      <SelectItem value="anna">Anna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Customer List */}
          <Card>
            <CardContent className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Customer List ({dummyCustomers.length} customers)</h2>
              </div>
              
              <div className="grid gap-4">
                {dummyCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 items-center">
                      <div className="lg:col-span-2">
                        <div className="font-semibold text-gray-900">{customer.fullName}</div>
                      </div>
                      
                      <div className="text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          customer.customerType === 'Buyer' ? 'bg-green-100 text-green-800' :
                          customer.customerType === 'Renter' ? 'bg-blue-100 text-blue-800' :
                          customer.customerType === 'Investor' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {customer.customerType}
                        </span>
                      </div>
                      
                      <div className="text-center">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          {customer.phase}
                        </span>
                      </div>
                      
                      <div className="text-center text-gray-600">
                        {customer.location}
                      </div>
                      
                      <div className="text-center text-gray-900 font-medium">
                        {customer.budgetRange}
                      </div>
                      
                      <div className="text-center text-gray-600">
                        {customer.salesperson}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{customer.lastContact}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <Button variant="outline">
                  Show more customers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Customers;
