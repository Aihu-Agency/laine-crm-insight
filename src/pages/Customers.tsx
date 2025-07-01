
import Navigation from "@/components/Navigation";
import CustomerFilters from "@/components/CustomerFilters";
import CustomerList from "@/components/CustomerList";

interface CustomersProps {
  onLogout?: () => void;
}

const Customers = ({ onLogout }: CustomersProps) => {
  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Customers</h1>
          
          <CustomerFilters />
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Customer List</h2>
            <p className="text-sm text-gray-600">15 customers found</p>
          </div>
          
          <CustomerList />
        </div>
      </div>
    </div>
  );
};

export default Customers;
