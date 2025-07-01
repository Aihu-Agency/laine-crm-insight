
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CustomerFilters = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-laine-mint hover:bg-laine-mint/90 text-gray-800">
          Create new customer
        </Button>
      </div>
      
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
            <Label>Phase</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-3">0-3 months</SelectItem>
                <SelectItem value="3-6">3-6 months</SelectItem>
                <SelectItem value="6-12">6-12 months</SelectItem>
                <SelectItem value="12+">12+ months</SelectItem>
              </SelectContent>
            </Select>
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
    </div>
  );
};

export default CustomerFilters;
