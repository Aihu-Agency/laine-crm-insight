import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, DollarSign, User, Calendar, Phone, Mail, Edit, Plus, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const CustomerView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isEditingNextAction, setIsEditingNextAction] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [nextActionInput, setNextActionInput] = useState("");
  const [nextActionTypeInput, setNextActionTypeInput] = useState("");
  const [nextActionDateInput, setNextActionDateInput] = useState<Date>();
  const [notesInput, setNotesInput] = useState("");

  const { data: customerData, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => airtableApi.getCustomer(id!),
    enabled: !!id,
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ customerId, data }: { customerId: string; data: Partial<Customer> }) =>
      airtableApi.updateCustomer(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-laine-grey">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Loading customer...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customerData) {
    return (
      <div className="min-h-screen bg-laine-grey">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Customer Not Found</h1>
            <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/customers")}>
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleEditCustomer = () => {
    navigate(`/customers/add?edit=true&customerId=${id}`, { 
      state: { 
        initialData: customerData,
        isEditing: true 
      } 
    });
  };

  const handleScheduleNextAction = () => {
    if (nextActionInput && nextActionTypeInput && nextActionDateInput) {
      updateCustomerMutation.mutate({
        customerId: id!,
        data: {
          nextActionType: nextActionTypeInput,
          nextActionDate: format(nextActionDateInput, 'yyyy-MM-dd'),
        }
      });
      setIsEditingNextAction(false);
      setNextActionInput("");
      setNextActionTypeInput("");
      setNextActionDateInput(undefined);
    }
  };

  const handleAddNote = () => {
    setIsEditingNotes(true);
    setNotesInput(customerData.notes || "");
  };

  const handleSaveNote = () => {
    updateCustomerMutation.mutate({
      customerId: id!,
      data: {
        notes: notesInput
      }
    });
    setIsEditingNotes(false);
  };

  const handleCancelNote = () => {
    setIsEditingNotes(false);
    setNotesInput("");
  };

  const handleBackClick = () => {
    navigate("/customers");
  };

  const getPhaseColor = (phase: string) => {
    if (phase.includes("0-3") || phase === "New Lead") return "bg-red-50 text-red-700 border-red-200";
    if (phase.includes("3-6") || phase === "Qualified Lead") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (phase.includes("6-12") || phase === "Opportunity") return "bg-blue-50 text-blue-700 border-blue-200";
    if (phase === "Proposal") return "bg-purple-50 text-purple-700 border-purple-200";
    if (phase === "Closed Won") return "bg-green-50 text-green-700 border-green-200";
    if (phase === "Closed Lost") return "bg-gray-50 text-gray-700 border-gray-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Mock suggested properties data
  const suggestedProperties = [
    {
      id: 1,
      propertyType: "Apartment",
      bedrooms: 3,
      bathrooms: 2,
      price: 350000,
      location: "Puerto Banús, Marbella",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      propertyType: "Villa",
      bedrooms: 2,
      bathrooms: 2,
      price: 395000,
      location: "Marbella Golden Mile",
      image: "/placeholder.svg"
    }
  ];

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation />
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleBackClick} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{customerData.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getPhaseColor(customerData.phase)} border`}>
                  {customerData.phase}
                </Badge>
                {customerData.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleEditCustomer}>
              Edit Customer
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {customerData.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {customerData.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {customerData.location || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget Range</p>
                    <p className="font-medium flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {customerData.budgetRange || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Salesperson</p>
                    <p className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {customerData.salesperson || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Contact</p>
                    <p className="font-medium flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {customerData.lastContact || 'No contact recorded'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Property Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Property Types</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customerData.propertyType?.map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      )) || <span className="text-gray-400 text-sm">Not specified</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-medium">{customerData.bedrooms || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-medium">{customerData.bathrooms || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notes</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddNote}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Notes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!isEditingNotes ? (
                  <p className="text-gray-800">{customerData.notes || "No notes available"}</p>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Add notes about this customer..."
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveNote} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancelNote} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Next Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Next Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current action</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {customerData.nextActionType ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customerData.nextActionType}</p>
                          <p className="text-sm text-gray-600">
                            Due: {customerData.nextActionDate || 'No date set'}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditingNextAction(true)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-2">No next action scheduled</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditingNextAction(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Schedule Action
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditingNextAction && (
                  <div className="space-y-3 p-3 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Action Type</label>
                      <Select value={nextActionTypeInput} onValueChange={setNextActionTypeInput}>
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
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <Calendar className="mr-2 h-4 w-4" />
                            {nextActionDateInput ? format(nextActionDateInput, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={nextActionDateInput}
                            onSelect={setNextActionDateInput}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleScheduleNextAction} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        onClick={() => setIsEditingNextAction(false)} 
                        variant="outline" 
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggested Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Suggested properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestedProperties.map((property) => (
                    <div key={property.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{property.propertyType}</p>
                          <p className="text-sm text-gray-600">{property.location}</p>
                        </div>
                        <p className="font-semibold text-green-600">€{property.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>{property.bedrooms} bed</span>
                        <span>{property.bathrooms} bath</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // In a real app, this would navigate to property details
                          console.log("Navigate to property", property.id);
                        }}
                      >
                        View Property
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerView;