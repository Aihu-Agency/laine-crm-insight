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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";
import Navigation from "./Navigation";
import { supabase } from "@/integrations/supabase/client";

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
    
    nextActionNote: initialData?.nextActionNote || '',
  });

  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(
    initialData?.nextActionDate ? new Date(initialData.nextActionDate) : undefined
  );
  const [propertyTypes, setPropertyTypes] = useState<string[]>(initialData?.propertyType || []);
  const [areasOfInterestList, setAreasOfInterestList] = useState<string[]>(
    initialData?.areasOfInterest ? initialData.areasOfInterest.split(', ') : []
  );
  const [bedrooms, setBedrooms] = useState<number | undefined>(initialData?.bedrooms);
  const [bathrooms, setBathrooms] = useState<number | undefined>(initialData?.bathrooms);

  // Load salespeople from Supabase
  const { data: salespeople, isLoading: spLoading } = useQuery({
    queryKey: ['salespeople'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_salespeople');
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.user_id as string,
        firstName: (p.first_name as string | null) ?? null,
        lastName: (p.last_name as string | null) ?? null,
      }));
    },
  });

  const salespersonOptions = (salespeople ?? []).map((p: any) => {
    const fn = (p.firstName || '').trim();
    const ln = (p.lastName || '').trim();
    return fn || ln || 'Unknown';
  });

  const createCustomerMutation = useMutation({
    mutationFn: (customerData: Partial<Customer>) => airtableApi.createCustomer(customerData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      if ((data as any)?._warnings?.length) {
        toast({
          title: "Note",
          description: (data as any)._warnings.join(' '),
        });
      }
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      if ((data as any)?._warnings?.length) {
        toast({
          title: "Note",
          description: (data as any)._warnings.join(' '),
        });
      }
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

  const handleAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setAreasOfInterestList([...areasOfInterestList, area]);
    } else {
      setAreasOfInterestList(areasOfInterestList.filter(a => a !== area));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const customerData: Partial<Customer> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      
      language: formData.language,
      customerType: formData.customerType,
      customerCategory: formData.customerCategory,
      timeOfPurchase: formData.timeOfPurchase,
      minPrice: formData.minPrice,
      maxPrice: formData.maxPrice,
      areasOfInterest: areasOfInterestList.join(', '),
      mustHave: formData.mustHave,
      niceToHave: formData.niceToHave,
      neighborhoodOrAddress: formData.neighborhoodOrAddress,
      salesperson: formData.salesperson,
      sourceOfContact: formData.sourceOfContact,
      propertyType: propertyTypes,
      bedrooms,
      bathrooms,
      notes: formData.notes,
      
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
  const areaOptions = ["Marbella", "Puerto Banus", "Malaga", "Fuengirola", "Mijas", "Torremolinos", "Other"]; 
  const bedroomOptions = ['1', '2', '3', '4+'];
  const bathroomOptions = ['1', '2', '3+'];

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
                        <SelectItem value="Spanish">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourceOfContact">Source of Contact</Label>
                    <Input 
                      id="sourceOfContact" 
                      value={formData.sourceOfContact}
                      onChange={(e) => setFormData({...formData, sourceOfContact: e.target.value})}
                      placeholder="Enter source of contact"
                    />
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
                    <Label htmlFor="customerType">Customer Type</Label>
                    <Select value={formData.customerType} onValueChange={(value) => setFormData({...formData, customerType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buyer">Buyer</SelectItem>
                        <SelectItem value="Renter">Renter</SelectItem>
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
                        <SelectItem value="Investor">Investor</SelectItem>
                        <SelectItem value="Holiday home">Holiday home</SelectItem>
                        <SelectItem value="Primary residence">Primary residence</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
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
                        <SelectItem value="1-3 months">1-3 months</SelectItem>
                        <SelectItem value="3-6 months">3-6 months</SelectItem>
                        <SelectItem value="6-12 months">6-12 months</SelectItem>
                        <SelectItem value="Later">Later</SelectItem>
                        <SelectItem value="Property shown">Property shown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesperson">Salesperson</Label>
                    <Select value={formData.salesperson} onValueChange={(value) => setFormData({...formData, salesperson: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select salesperson" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {spLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (salespersonOptions.length ? (
                          salespersonOptions.map((name: string, idx: number) => (
                            <SelectItem key={`${name}-${idx}`} value={name}>{name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No salespeople</SelectItem>
                        ))}
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
                    <Label>Areas of Interest</Label>
                    <div className="flex flex-wrap gap-4">
                      {areaOptions.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`area-${area}`}
                            checked={areasOfInterestList.includes(area)}
                            onCheckedChange={(checked) => handleAreaChange(area, checked as boolean)}
                          />
                          <Label htmlFor={`area-${area}`}>{area}</Label>
                        </div>
                      ))}
                    </div>
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
                      <Select value={bedrooms === 4 ? '4+' : (bedrooms?.toString() || "")} onValueChange={(value) => setBedrooms(value ? (value === '4+' ? 4 : parseInt(value)) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bedrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          {bedroomOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Select value={bathrooms === 3 ? '3+' : (bathrooms?.toString() || "")} onValueChange={(value) => setBathrooms(value ? (value === '3+' ? 3 : parseInt(value)) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bathrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          {bathroomOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
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

                  <div className="space-y-2">
                    <Label htmlFor="nextActionNote">Next Action Note</Label>
                    <Input 
                      id="nextActionNote" 
                      value={formData.nextActionNote}
                      onChange={(e) => setFormData({...formData, nextActionNote: e.target.value})}
                      placeholder="Additional details about the next action"
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