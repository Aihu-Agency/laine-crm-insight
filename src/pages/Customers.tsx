
import Navigation from "@/components/Navigation";
import CustomerFilters from "@/components/CustomerFilters";
import CustomerList from "@/components/CustomerList";
import { useState } from "react";
import { CustomerFiltersValue } from "@/types/filters";
import { Link } from "react-router-dom";

interface CustomersProps {
  onLogout?: () => void;
}

const Customers = ({ onLogout }: CustomersProps) => {
  const [filters, setFilters] = useState<CustomerFiltersValue>({ search: "", location: "", salesperson: "" });
  const [resultsCount, setResultsCount] = useState<number>(0);
  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
            <Link to="/customers/add" className="bg-laine-mint hover:bg-laine-mint/90 text-gray-800 px-4 py-2 rounded font-medium">
              + Add new customer
            </Link>
          </div>
          
          <CustomerFilters value={filters} onChange={setFilters} onClear={() => setFilters({ search: "", location: "", salesperson: "" })} />
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Customer List</h2>
            <p className="text-sm text-gray-600">{resultsCount} customers found</p>
          </div>
          
          <CustomerList filters={filters} onCountChange={setResultsCount} />
        </div>
      </div>
    </div>
  );
};

export default Customers;
