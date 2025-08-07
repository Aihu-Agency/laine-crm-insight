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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";
import Navigation from "./Navigation";

interface AddClientFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: Partial<Customer>;
  isEditing?: boolean;
}

const AddClientForm = ({ onSave, onCancel, initialData, isEditing = false }: AddClientFormProps) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    phase: initialData?.phase || 'New Lead',
    language: initialData?.language || '',
    customerType: initialData?.customerType || '',
    customerCategory: initialData?.customerCategory || '',
    timeOfPurchase: initialData?.timeOfPurchase || '',
    minPrice: initialData?.minPrice || undefined as number | undefined,
    maxPrice: initialData?.maxPrice || undefined as number | undefined,
    areasOfInterest: initialData?.areasOfInterest || '',
    mustHave: initialData?.mustHave || '',
    niceToHave: initialData?.niceToHave || '',
    neighborhoodOrAddress: initialData?.neighborhoodOrAddress || '',
    salesperson: initialData?.salesperson || '',
    sourceOfContact: initialData?.sourceOfContact || '',
    notes: initialData?.notes || '',
    nextActionType: initialData?.nextActionType || '',
    nextActionNote: initialData?.nextActionNote || '',
  });

  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(
    initialData?.nextActionDate ? new Date(initialData.nextActionDate) : undefined
  );
  const [propertyTypes, setPropertyTypes] = useState<string[]>(initialData?.propertyType || []);
  const [bedrooms, setBedrooms] = useState<number | undefined>(initialData?.bedrooms);
  const [bathrooms, setBathrooms] = useState<number | undefined>(initialData?.bathrooms);

  const createCustomerMutation = useMutation({
    mutationFn: (customerData: Partial<Customer>) => airtableApi.createCustomer(customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      airtableApi.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const handlePropertyTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setPropertyTypes([...propertyTypes, type]);
    } else {
      setPropertyTypes(propertyTypes.filter(t => t !== type));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const customerData: Partial<Customer> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      phase: formData.phase,
      language: formData.language,
      customerType: formData.customerType,
      customerCategory: formData.customerCategory,
      timeOfPurchase: formData.timeOfPurchase,
      minPrice: formData.minPrice,
      maxPrice: formData.maxPrice,
      areasOfInterest: formData.areasOfInterest,
      mustHave: formData.mustHave,
      niceToHave: formData.niceToHave,
      neighborhoodOrAddress: formData.neighborhoodOrAddress,
      salesperson: formData.salesperson,
      sourceOfContact: formData.sourceOfContact,
      propertyType: propertyTypes,
      bedrooms,
      bathrooms,
      notes: formData.notes,
      nextActionType: formData.nextActionType,
      nextActionNote: formData.nextActionNote,
      nextActionDate: nextActionDate ? format(nextActionDate, 'yyyy-MM-dd') : undefined,
    };

    if (isEditing && initialData?.id) {
      updateCustomerMutation.mutate({ id: initialData.id, data: customerData });
    } else {
      createCustomerMutation.mutate(customerData);
    }
  };

  const propertyTypeOptions = ["Apartment", "House", "Penthouse", "Villa", "Duplex"];
  const bedroomOptions = [1, 2, 3, 4, 5];
  const bathroomOptions = [1, 2, 3, 4];

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">
                {isEditing ? "Edit customer" : "Add New Client"}
              </CardTitle>
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
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Finnish">Finnish</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Swedish">Swedish</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourceOfContact">Source of Contact</Label>
                    <Select value={formData.sourceOfContact} onValueChange={(value) => setFormData({...formData, sourceOfContact: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Advertisement">Advertisement</SelectItem>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Customer Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phase">Phase</Label>
                    <Select value={formData.phase} onValueChange={(value) => setFormData({...formData, phase: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select phase" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New Lead">New Lead</SelectItem>
                        <SelectItem value="Qualified Lead">Qualified Lead</SelectItem>
                        <SelectItem value="Opportunity">Opportunity</SelectItem>
                        <SelectItem value="Proposal">Proposal</SelectItem>
                        <SelectItem value="Closed Won">Closed Won</SelectItem>
                        <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerType">Customer Type</Label>
                    <Select value={formData.customerType} onValueChange={(value) => setFormData({...formData, customerType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buyer">Buyer</SelectItem>
                        <SelectItem value="Seller">Seller</SelectItem>
                        <SelectItem value="Renter">Renter</SelectItem>
                        <SelectItem value="Investor">Investor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerCategory">Customer Category</Label>
                    <Select value={formData.customerCategory} onValueChange={(value) => setFormData({...formData, customerCategory: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First-time buyer">First-time buyer</SelectItem>
                        <SelectItem value="Experienced buyer">Experienced buyer</SelectItem>
                        <SelectItem value="Investor">Investor</SelectItem>
                        <SelectItem value="Relocating">Relocating</SelectItem>
                        <SelectItem value="Downsizing">Downsizing</SelectItem>
                        <SelectItem value="Upsizing">Upsizing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeOfPurchase">Time of Purchase</Label>
                    <Select value={formData.timeOfPurchase} onValueChange={(value) => setFormData({...formData, timeOfPurchase: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediately">Immediately</SelectItem>
                        <SelectItem value="Within 3 months">Within 3 months</SelectItem>
                        <SelectItem value="3-6 months">3-6 months</SelectItem>
                        <SelectItem value="6-12 months">6-12 months</SelectItem>
                        <SelectItem value="Over 1 year">Over 1 year</SelectItem>
                        <SelectItem value="Just browsing">Just browsing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesperson">Salesperson</Label>
                    <Select value={formData.salesperson} onValueChange={(value) => setFormData({...formData, salesperson: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select salesperson" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laura">Laura</SelectItem>
                        <SelectItem value="Anna">Anna</SelectItem>
                        <SelectItem value="Mikko">Mikko</SelectItem>
                        <SelectItem value="Sari">Sari</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Budget & Location */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Budget & Location</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPrice">Min Price (€)</Label>
                    <Input 
                      id="minPrice" 
                      type="number"
                      value={formData.minPrice || ''}
                      onChange={(e) => setFormData({...formData, minPrice: e.target.value ? parseInt(e.target.value) : undefined})}
                      placeholder="e.g., 300000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Max Price (€)</Label>
                    <Input 
                      id="maxPrice" 
                      type="number"
                      value={formData.maxPrice || ''}
                      onChange={(e) => setFormData({...formData, maxPrice: e.target.value ? parseInt(e.target.value) : undefined})}
                      placeholder="e.g., 500000"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="areasOfInterest">Areas of Interest</Label>
                    <Input 
                      id="areasOfInterest" 
                      value={formData.areasOfInterest}
                      onChange={(e) => setFormData({...formData, areasOfInterest: e.target.value})}
                      placeholder="e.g., Helsinki, Espoo, Vantaa"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="neighborhoodOrAddress">Neighborhood or Address</Label>
                    <Input 
                      id="neighborhoodOrAddress" 
                      value={formData.neighborhoodOrAddress}
                      onChange={(e) => setFormData({...formData, neighborhoodOrAddress: e.target.value})}
                      placeholder="Specific neighborhood or address preferences"
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
                    <Label>Property Types</Label>
                    <div className="flex flex-wrap gap-4">
                      {propertyTypeOptions.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`property-${type}`}
                            checked={propertyTypes.includes(type)}
                            onCheckedChange={(checked) => handlePropertyTypeChange(type, checked as boolean)}
                          />
                          <Label htmlFor={`property-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Select value={bedrooms?.toString() || ""} onValueChange={(value) => setBedrooms(value ? parseInt(value) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bedrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          {bedroomOptions.map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Select value={bathrooms?.toString() || ""} onValueChange={(value) => setBathrooms(value ? parseInt(value) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bathrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          {bathroomOptions.map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mustHave">Must Have</Label>
                      <Textarea 
                        id="mustHave" 
                        value={formData.mustHave}
                        onChange={(e) => setFormData({...formData, mustHave: e.target.value})}
                        placeholder="Required features (e.g., balcony, parking, elevator)"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="niceToHave">Nice to Have</Label>
                      <Textarea 
                        id="niceToHave" 
                        value={formData.niceToHave}
                        onChange={(e) => setFormData({...formData, niceToHave: e.target.value})}
                        placeholder="Desired features (e.g., sauna, garden, sea view)"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes and Next Action */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Notes & Next Action</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes about the customer"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nextActionType">Next Action Type</Label>
                      <Select value={formData.nextActionType} onValueChange={(value) => setFormData({...formData, nextActionType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phone Call">Phone Call</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Property Viewing">Property Viewing</SelectItem>
                          <SelectItem value="Meeting">Meeting</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Next Action Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
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
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextActionNote">Next Action Note</Label>
                    <Textarea 
                      id="nextActionNote" 
                      value={formData.nextActionNote}
                      onChange={(e) => setFormData({...formData, nextActionNote: e.target.value})}
                      placeholder="Additional details about the next action"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={onCancel}
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                  className="px-8 bg-laine-mint hover:bg-laine-mint/90 text-gray-800"
                >
                  {(createCustomerMutation.isPending || updateCustomerMutation.isPending) ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AddClientForm;