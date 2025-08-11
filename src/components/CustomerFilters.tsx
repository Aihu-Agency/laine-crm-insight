
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CustomerFilters = () => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search by name</Label>
          <Input 
            id="search" 
            placeholder="Enter customer name"
            className="w-full"
          />
        </div>
        
        
        <div className="space-y-2">
          <Label>Location</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marbella">Marbella</SelectItem>
              <SelectItem value="estepona">Estepona</SelectItem>
              <SelectItem value="fuengirola">Fuengirola</SelectItem>
              <SelectItem value="torremolinos">Torremolinos</SelectItem>
              <SelectItem value="benalmadena">Benalmádena</SelectItem>
              <SelectItem value="mijas">Mijas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Salesperson</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select salesperson" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="laura">Laura</SelectItem>
              <SelectItem value="anna">Anna</SelectItem>
              <SelectItem value="mikko">Mikko</SelectItem>
              <SelectItem value="sari">Sari</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-start">
        <Button variant="outline" className="text-gray-600">
          Clear filters
        </Button>
      </div>
    </div>
  );
};

export default CustomerFilters;
