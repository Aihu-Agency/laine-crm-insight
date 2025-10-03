import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Edit, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer, Property } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { CustomerActionsCard } from "@/components/CustomerActionsCard";

const CustomerView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");

  const { data: customerData, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => airtableApi.getCustomer(id!),
    enabled: !!id,
  });

  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', customerData?.propertyIds],
    queryFn: () => airtableApi.getProperties(customerData?.propertyIds || []),
    enabled: !!customerData?.propertyIds && customerData.propertyIds.length > 0,
  });

  // Limit to 2 properties for customer number 1002 (Mikko Tuominen), show all for others
  const displayProperties = customerData?.customerNumber === 1002 
    ? properties?.slice(0, 2) 
    : properties;

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
  
  const getTimeOfPurchaseBadge = (v?: string) => {
    if (!v) return <Badge variant="outline" className="text-xs">-</Badge>;
    const low = v.toLowerCase();
    let classes = "text-xs";
    if (low.includes("property shown")) classes += " bg-green-100 border-green-300 text-green-700";
    else if (low.includes("1-3") || low.includes("0-3")) classes += " bg-red-100 border-red-300 text-red-700";
    else if (low.includes("3-6")) classes += " bg-yellow-100 border-yellow-300 text-yellow-800";
    else if (low.includes("6-12")) classes += " bg-blue-100 border-blue-300 text-blue-700";
    else classes += " bg-gray-100 border-gray-300 text-gray-700";
    return <Badge variant="outline" className={classes}>{v}</Badge>;
  };
  
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
              <h1 className="text-2xl font-bold text-gray-800">{customerData.firstName} {customerData.lastName}</h1>
              <div className="flex items-center gap-2 mt-1">
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
                      {customerData.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {customerData.email || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Language</p>
                    <p className="font-medium">{customerData.language || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer type</p>
                    <p className="font-medium">{customerData.customerType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer category</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.isArray(customerData.customerCategory) && customerData.customerCategory.length > 0 ? (
                        customerData.customerCategory.map((cat, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time of purchase</p>
                    <p className="font-medium">{customerData.timeOfPurchase ? <span className="inline-block">{getTimeOfPurchaseBadge(customerData.timeOfPurchase)}</span> : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Source of contact</p>
                    <p className="font-medium">{customerData.sourceOfContact || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Salesperson</p>
                    <p className="font-medium">{customerData.salesperson ? `👤 ${customerData.salesperson}` : '-'}</p>
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{customerData.areasOfInterest ? `📍 ${customerData.areasOfInterest}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget range</p>
                    <p className="font-medium">
                      {customerData.minPrice && customerData.maxPrice
                        ? `💰 €${customerData.minPrice.toLocaleString()} - €${customerData.maxPrice.toLocaleString()}`
                        : customerData.minPrice
                        ? `💰 €${customerData.minPrice.toLocaleString()}+`
                        : customerData.maxPrice
                        ? `💰 Up to €${customerData.maxPrice.toLocaleString()}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Property type</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customerData.propertyType && customerData.propertyType.length > 0 ? (
                        customerData.propertyType.map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-medium">{customerData.bedrooms || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-medium">{customerData.bathrooms || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Views</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customerData.views && customerData.views.length > 0 ? (
                        customerData.views.map((view, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {view}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Orientation</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customerData.orientation && customerData.orientation.length > 0 ? (
                        customerData.orientation.map((orientation, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {orientation}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Other features</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customerData.otherFeatures && customerData.otherFeatures.length > 0 ? (
                        customerData.otherFeatures.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Condition</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customerData.condition && customerData.condition.length > 0 ? (
                        customerData.condition.map((condition, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <p className="text-sm text-gray-500">Neighborhood or address</p>
                    <p className="font-medium">{customerData.neighborhoodOrAddress || '-'}</p>
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
            {/* Customer Actions */}
            <CustomerActionsCard customerId={id!} />


            {/* Suggested Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Suggested properties
                  {customerData.propertyIds && customerData.propertyIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {customerData.propertyIds.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProperties ? (
                  <div className="text-sm text-muted-foreground">Loading properties...</div>
                ) : !displayProperties || displayProperties.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No properties matched yet</div>
                ) : (
                  <div className="space-y-2">
                    {displayProperties.map((property) => (
                      <div key={property.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        {/* Title and Property Type */}
                        <div className="mb-2">
                          <h4 className="font-semibold text-base">{property.title || 'Untitled Property'}</h4>
                          <p className="text-xs text-muted-foreground">{property.propertyType || 'Type not specified'}</p>
                        </div>

                        {/* Price */}
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">Price: </span>
                          <span className="font-bold text-green-600">
                            {property.price ? `€${property.price.toLocaleString()}` : 'Price not set'}
                          </span>
                        </div>
                        
                        {/* Area, Bedrooms, Bathrooms */}
                        <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Area:</span>
                            <span className="ml-1 font-medium">{property.area || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Bedrooms:</span>
                            <span className="ml-1 font-medium">{property.bedrooms || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Bathrooms:</span>
                            <span className="ml-1 font-medium">{property.bathrooms || '-'}</span>
                          </div>
                        </div>

                        {/* Summary */}
                        {property.summary && (
                          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs">
                            <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">AI Image Summary</p>
                            <p className="text-foreground">{property.summary}</p>
                          </div>
                        )}
                        
                        {/* View Details Button */}
                        {property.propertyDetailUrl && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs h-8"
                            onClick={() => window.open(property.propertyDetailUrl, '_blank')}
                          >
                            View Full Details
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerView;