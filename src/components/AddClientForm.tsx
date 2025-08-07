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
    firstName: initialData?.fullName?.split(' ')[0] || '',
    lastName: initialData?.fullName?.split(' ').slice(1).join(' ') || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    phase: initialData?.phase || 'New Lead',
    location: initialData?.location || '',
    budgetRange: initialData?.budgetRange || '',
    salesperson: initialData?.salesperson || '',
    notes: initialData?.notes || '',
    nextActionType: initialData?.nextActionType || '',
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
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      phase: formData.phase,
      location: formData.location,
      budgetRange: formData.budgetRange,
      salesperson: formData.salesperson,
      propertyType: propertyTypes,
      bedrooms,
      bathrooms,
      notes: formData.notes,
      nextActionType: formData.nextActionType,
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

              {/* Location and Budget */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Location & Budget</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Enter preferred location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetRange">Budget Range</Label>
                    <Input 
                      id="budgetRange" 
                      value={formData.budgetRange}
                      onChange={(e) => setFormData({...formData, budgetRange: e.target.value})}
                      placeholder="e.g., €300k - €400k"
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