
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Navigation from "./Navigation";

interface AddClientFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
    areaOfInterest?: string;
  };
}

const AddClientForm = ({ onSave, onCancel, initialData }: AddClientFormProps) => {
  const [nextActionDate, setNextActionDate] = useState<Date>();
  const [apartmentTypes, setApartmentTypes] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState<string[]>([]);
  const [bathrooms, setBathrooms] = useState<string[]>([]);

  const handleApartmentTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setApartmentTypes([...apartmentTypes, type]);
    } else {
      setApartmentTypes(apartmentTypes.filter(t => t !== type));
    }
  };

  const handleBedroomsChange = (bedroom: string, checked: boolean) => {
    if (checked) {
      setBedrooms([...bedrooms, bedroom]);
    } else {
      setBedrooms(bedrooms.filter(b => b !== bedroom));
    }
  };

  const handleBathroomsChange = (bathroom: string, checked: boolean) => {
    if (checked) {
      setBathrooms([...bathrooms, bathroom]);
    } else {
      setBathrooms(bathrooms.filter(b => b !== bathroom));
    }
  };

  const apartmentTypeOptions = ["Apartment", "House", "Penthouse", "Villa", "Duplex"];
  const bedroomOptions = ["Studio", "1", "2", "3", "4+"];
  const bathroomOptions = ["1", "2", "3+"];

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Add New Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    defaultValue={initialData?.firstName || ""} 
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    defaultValue={initialData?.lastName || ""} 
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerType">Customer Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="renter">Renter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="finnish">Finnish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Purchase Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeOfPurchase">Time of Purchase</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediately">Immediately</SelectItem>
                      <SelectItem value="1-3months">1–3 months</SelectItem>
                      <SelectItem value="3-6months">3–6 months</SelectItem>
                      <SelectItem value="later">Later</SelectItem>
                      <SelectItem value="property-shown">Property shown</SelectItem>
                      <SelectItem value="not-specified">Not specified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerCategory">Customer Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investor">Investor</SelectItem>
                      <SelectItem value="holiday-home">Holiday home</SelectItem>
                      <SelectItem value="primary-residence">Primary residence</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Min Price</Label>
                  <Input 
                    id="minPrice" 
                    type="number" 
                    placeholder="Minimum price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Max Price</Label>
                  <Input 
                    id="maxPrice" 
                    type="number" 
                    placeholder="Maximum price"
                  />
                </div>
              </div>
            </div>

            {/* Property Preferences */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Property Preferences</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="areasOfInterest">Areas of Interest</Label>
                  <Input 
                    id="areasOfInterest" 
                    defaultValue={initialData?.areaOfInterest || ""} 
                    placeholder="Enter areas of interest"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Type of Apartment</Label>
                  <div className="flex flex-wrap gap-4">
                    {apartmentTypeOptions.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`apartment-${type}`}
                          checked={apartmentTypes.includes(type)}
                          onCheckedChange={(checked) => handleApartmentTypeChange(type, checked as boolean)}
                        />
                        <Label htmlFor={`apartment-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <div className="flex flex-wrap gap-4">
                    {bedroomOptions.map((bedroom) => (
                      <div key={bedroom} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`bedroom-${bedroom}`}
                          checked={bedrooms.includes(bedroom)}
                          onCheckedChange={(checked) => handleBedroomsChange(bedroom, checked as boolean)}
                        />
                        <Label htmlFor={`bedroom-${bedroom}`}>{bedroom}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <div className="flex flex-wrap gap-4">
                    {bathroomOptions.map((bathroom) => (
                      <div key={bathroom} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`bathroom-${bathroom}`}
                          checked={bathrooms.includes(bathroom)}
                          onCheckedChange={(checked) => handleBathroomsChange(bathroom, checked as boolean)}
                        />
                        <Label htmlFor={`bathroom-${bathroom}`}>{bathroom}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Additional Information</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mustHave">Must Have</Label>
                  <Textarea 
                    id="mustHave" 
                    placeholder="List must-have features or requirements"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niceToHave">Nice to Have</Label>
                  <Textarea 
                    id="niceToHave" 
                    placeholder="List nice-to-have features or preferences"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Neighborhood or Address</Label>
                  <Input 
                    id="neighborhood" 
                    placeholder="Enter preferred neighborhood or specific address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source of Contact</Label>
                  <Input 
                    id="source" 
                    placeholder="How did they find us?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes / Comments</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Additional notes or comments"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Next Action */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Next Action</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Next Action Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !nextActionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {nextActionDate ? format(nextActionDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={nextActionDate}
                        onSelect={setNextActionDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextActionNote">Next Action Note</Label>
                  <Input 
                    id="nextActionNote" 
                    placeholder="Brief description of next action"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="px-8"
              >
                Cancel
              </Button>
              <Button 
                onClick={onSave}
                className="px-8 bg-laine-mint hover:bg-laine-mint/90 text-gray-800"
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddClientForm;
