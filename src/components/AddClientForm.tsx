import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { Customer } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";
import Navigation from "./Navigation";
import { supabase } from "@/integrations/supabase/client";
import { areasTree, normalizeAndValidateAreas } from "@/constants/areas-tree";
import { HierarchicalMultiSelect } from "@/components/HierarchicalMultiSelect";
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
    
    timeOfPurchase: initialData?.timeOfPurchase || '',
    minPrice: initialData?.minPrice || undefined as number | undefined,
    maxPrice: initialData?.maxPrice || undefined as number | undefined,
    areasOfInterest: initialData?.areasOfInterest || '',
    mustHave: initialData?.mustHave || '',
    niceToHave: initialData?.niceToHave || '',
    neighborhoodOrAddress: initialData?.neighborhoodOrAddress || '',
    salesperson: initialData?.salesperson || '',
    notes: initialData?.notes || '',
    
    nextActionNote: initialData?.nextActionNote || '',
  });

  // Source of Contact options and state
  const SOURCE_OF_CONTACT_OPTIONS = [
    'Chat',
    'Contact form, property link from web page',
    'Customer reference',
    'Direct email contact',
    'Direct phone contact',
    'Etuovi',
    'Facebook or Instagram',
    'Idealista',
    'Loading brochure from website',
    'Matkamessut',
    'Oikotie',
    'Other',
    'Place in the Sun',
    'Property listing',
    'Seminars',
    'Spainhouses',
    'Visiting office'
  ];

  const [selectedSourceOfContact, setSelectedSourceOfContact] = useState<string[]>(() => {
    if (initialData?.sourceOfContact) {
      if (Array.isArray(initialData.sourceOfContact)) {
        return initialData.sourceOfContact.filter(contact => SOURCE_OF_CONTACT_OPTIONS.includes(contact));
      } else {
        const contacts = initialData.sourceOfContact.split(',').map(s => s.trim()).filter(Boolean);
        return contacts.filter(contact => SOURCE_OF_CONTACT_OPTIONS.includes(contact));
      }
    }
    return [];
  });

  // Budget formatting state
  const [minPriceText, setMinPriceText] = useState(() => 
    initialData?.minPrice ? initialData.minPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
  );
  const [maxPriceText, setMaxPriceText] = useState(() => 
    initialData?.maxPrice ? initialData.maxPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
  );

  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(
    initialData?.nextActionDate ? new Date(initialData.nextActionDate) : undefined
  );

  const [activeSearchDate, setActiveSearchDate] = useState<Date | undefined>(
    initialData?.activeSearchDate ? new Date(initialData.activeSearchDate) : undefined
  );
  
  // Normalize initial Areas of Interest and track any dropped values
  const initialAreasRaw = initialData?.areasOfInterest
    ? initialData.areasOfInterest.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const validatedInitialAreas = normalizeAndValidateAreas(initialAreasRaw);
  const droppedAreas = initialAreasRaw.filter(area => !validatedInitialAreas.includes(area));

  const [propertyTypes, setPropertyTypes] = useState<string[]>(initialData?.propertyType || []);
  const [areasOfInterestList, setAreasOfInterestList] = useState<string[]>(validatedInitialAreas);
  const [bedroomsSelected, setBedroomsSelected] = useState<string[]>(() => {
    if (initialData?.bedrooms !== undefined && initialData?.bedrooms !== null) {
      const b = initialData.bedrooms;
      return [b >= 4 ? '4+' : String(b)];
    }
    return [];
  });
  const [bathroomsSelected, setBathroomsSelected] = useState<string[]>(() => {
    if (initialData?.bathrooms !== undefined && initialData?.bathrooms !== null) {
      const b = initialData.bathrooms;
      return [b >= 3 ? '3+' : String(b) + '+'];
    }
    return [];
  });
  const [customerCategories, setCustomerCategories] = useState<string[]>(
    Array.isArray(initialData?.customerCategory)
      ? (initialData?.customerCategory as string[])
      : (initialData?.customerCategory ? [initialData.customerCategory as unknown as string] : [])
  );

  // New multi-select states for property features
  const [viewsSelected, setViewsSelected] = useState<string[]>(initialData?.views || []);
  const [orientationSelected, setOrientationSelected] = useState<string[]>(initialData?.orientation || []);
  const [otherFeaturesSelected, setOtherFeaturesSelected] = useState<string[]>(initialData?.otherFeatures || []);
  const [conditionSelected, setConditionSelected] = useState<string[]>(initialData?.condition || []);

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
    return fn && ln ? `${fn} ${ln}` : fn || ln || 'Unknown';
  });

  // Check if user is admin and set default salesperson
  useEffect(() => {
    const checkUserRole = async () => {
      // Only set default if not editing and salesperson not already set
      if (isEditing || formData.salesperson) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const isAdmin = roles?.some(r => r.role === 'admin');
      
      // If not admin, default to current user
      if (!isAdmin && salespeople) {
        const currentUser = salespeople.find((p: any) => p.id === user.id);
        if (currentUser) {
          const fn = (currentUser.firstName || '').trim();
          const ln = (currentUser.lastName || '').trim();
          const fullName = fn && ln ? `${fn} ${ln}` : fn || ln || 'Unknown';
          setFormData(prev => ({ ...prev, salesperson: fullName }));
        }
      }
    };
    
    checkUserRole();
  }, [salespeople, isEditing, formData.salesperson]);

  const createCustomerMutation = useMutation({
    mutationFn: (customerData: Partial<Customer>) => airtableApi.createCustomer(customerData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-funnel'] });
      queryClient.invalidateQueries({ queryKey: ['customers-page'] });
      queryClient.invalidateQueries({ queryKey: ['customers-all'] });
      queryClient.invalidateQueries({ queryKey: ['customers-all-navigation'] });
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
      sessionStorage.removeItem('sales-funnel-filters');
      sessionStorage.removeItem('customers-filters');
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
      queryClient.invalidateQueries({ queryKey: ['customers-funnel'] });
      queryClient.invalidateQueries({ queryKey: ['customers-page'] });
      queryClient.invalidateQueries({ queryKey: ['customers-all'] });
      queryClient.invalidateQueries({ queryKey: ['customers-all-navigation'] });
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

  const handleSourceOfContactChange = (source: string, checked: boolean) => {
    if (checked) {
      setSelectedSourceOfContact([...selectedSourceOfContact, source]);
    } else {
      setSelectedSourceOfContact(selectedSourceOfContact.filter(s => s !== source));
    }
  };

  const formatPriceInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPriceInput(e.target.value);
    setMinPriceText(formatted);
    const numericValue = formatted.replace(/\s/g, '');
    setFormData({...formData, minPrice: numericValue ? parseInt(numericValue) : undefined});
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPriceInput(e.target.value);
    setMaxPriceText(formatted);
    const numericValue = formatted.replace(/\s/g, '');
    setFormData({...formData, maxPrice: numericValue ? parseInt(numericValue) : undefined});
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
      customerCategory: customerCategories,
      timeOfPurchase: formData.timeOfPurchase,
      minPrice: formData.minPrice,
      maxPrice: formData.maxPrice,
      areasOfInterest: areasOfInterestList.join(', '),
      views: viewsSelected,
      orientation: orientationSelected,
      otherFeatures: otherFeaturesSelected,
      condition: conditionSelected,
      neighborhoodOrAddress: formData.neighborhoodOrAddress,
      salesperson: formData.salesperson,
      sourceOfContact: selectedSourceOfContact,
      propertyType: propertyTypes,
      bedrooms: bedroomsSelected as any,
      bathrooms: bathroomsSelected as any,
      notes: formData.notes,
      
      nextActionNote: formData.nextActionNote,
      nextActionDate: nextActionDate ? format(nextActionDate, 'yyyy-MM-dd') : undefined,
      activeSearchDate: activeSearchDate ? format(activeSearchDate, 'yyyy-MM-dd') : undefined,
    };

    if (isEditing && initialData?.id) {
      updateCustomerMutation.mutate({ id: initialData.id, data: customerData });
    } else {
      createCustomerMutation.mutate(customerData);
    }
  };

  const propertyTypeOptions = ["Apartment", "House", "Penthouse", "Villa", "Duplex", "Town house", "Semi-detached"]; 
  const bedroomOptions = ['1', '2', '3', '4+'];
  const bathroomOptions = ['1+', '2+', '3+'];
  const categoryOptions = ["Investor","Holiday home","Primary residence","New-build customer","Resale buyer","Other"];

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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" role="combobox" className="w-full justify-between text-left font-normal">
                          {selectedSourceOfContact.length ? `${selectedSourceOfContact.length} selected` : 'Select source of contact'}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="start" className="w-[var(--radix-popper-anchor-width)] p-2 z-50">
                        <div className="space-y-1">
                          {SOURCE_OF_CONTACT_OPTIONS.map((source) => (
                            <div key={source} className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent cursor-pointer">
                              <Checkbox
                                id={`source-${source}`}
                                checked={selectedSourceOfContact.includes(source)}
                                onCheckedChange={(checked) => handleSourceOfContactChange(source, Boolean(checked))}
                              />
                              <Label htmlFor={`source-${source}`}>{source}</Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
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
                        <SelectItem value="Seller">Seller</SelectItem>
                        <SelectItem value="Rental owner">Rental owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerCategory">Customer Category</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" role="combobox" className="w-full justify-between text-left font-normal">
                          {customerCategories.length ? `${customerCategories.length} selected` : 'Select categories'}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="start" className="w-[var(--radix-popper-anchor-width)] p-2 z-50">
                        <div className="space-y-1">
                          {categoryOptions.map((cat) => (
                            <div key={cat} className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent cursor-pointer">
                              <Checkbox
                                id={`cat-${cat}`}
                                checked={customerCategories.includes(cat)}
                                onCheckedChange={(checked) => {
                                  const isChecked = Boolean(checked);
                                  setCustomerCategories(isChecked
                                    ? [...customerCategories, cat]
                                    : customerCategories.filter((c) => c !== cat)
                                  );
                                }}
                              />
                              <Label htmlFor={`cat-${cat}`}>{cat}</Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
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
                        <SelectItem value="Unclear">Unclear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Active Search Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !activeSearchDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activeSearchDate ? format(activeSearchDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={activeSearchDate}
                          onSelect={setActiveSearchDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
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
                      type="text"
                      value={minPriceText}
                      onChange={handleMinPriceChange}
                      placeholder="e.g., 300 000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Max Price (€)</Label>
                    <Input 
                      id="maxPrice" 
                      type="text"
                      value={maxPriceText}
                      onChange={handleMaxPriceChange}
                      placeholder="e.g., 500 000"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Areas of Interest</Label>
                    {droppedAreas.length > 0 && (
                      <p className="text-sm text-muted-foreground">Ignored invalid areas: {droppedAreas.join(', ')}</p>
                    )}
                    <HierarchicalMultiSelect
                      tree={areasTree}
                      selected={areasOfInterestList}
                      onChange={setAreasOfInterestList}
                      placeholder="Select areas of interest"
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
                      <Label>Bedrooms</Label>
                      <div className="flex flex-wrap gap-4">
                        {bedroomOptions.map((opt) => (
                          <div key={opt} className="flex items-center space-x-2">
                            <Checkbox
                              id={`bedroom-${opt}`}
                              checked={bedroomsSelected.includes(opt)}
                              onCheckedChange={(checked) => {
                                setBedroomsSelected(Boolean(checked) ? [opt] : []);
                              }}
                            />
                            <Label htmlFor={`bedroom-${opt}`}>{opt}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bathrooms</Label>
                      <div className="flex flex-wrap gap-4">
                        {bathroomOptions.map((opt) => (
                          <div key={opt} className="flex items-center space-x-2">
                            <Checkbox
                              id={`bathroom-${opt}`}
                              checked={bathroomsSelected.includes(opt)}
                              onCheckedChange={(checked) => {
                                setBathroomsSelected(Boolean(checked)
                                  ? [...bathroomsSelected, opt]
                                  : bathroomsSelected.filter(b => b !== opt)
                                );
                              }}
                            />
                            <Label htmlFor={`bathroom-${opt}`}>{opt}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Property Feature Multi-selects */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Views */}
                    <div className="space-y-2">
                      <Label>Views</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" className="w-full justify-between text-left font-normal">
                            {viewsSelected.length ? `${viewsSelected.length} selected` : 'Select views'}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="w-[var(--radix-popper-anchor-width)] p-2 z-50">
                          <div className="space-y-1">
                            {['Garden', 'Golf', 'Mountain', 'Swimming pool', 'Sea', 'Street'].map((view) => (
                              <div key={view} className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent cursor-pointer">
                                <Checkbox
                                  id={`view-${view}`}
                                  checked={viewsSelected.includes(view)}
                                  onCheckedChange={(checked) => {
                                    const isChecked = Boolean(checked);
                                    setViewsSelected(isChecked
                                      ? [...viewsSelected, view]
                                      : viewsSelected.filter((v) => v !== view)
                                    );
                                  }}
                                />
                                <Label htmlFor={`view-${view}`}>{view}</Label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Orientation */}
                    <div className="space-y-2">
                      <Label>Orientation</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" className="w-full justify-between text-left font-normal">
                            {orientationSelected.length ? `${orientationSelected.length} selected` : 'Select orientation'}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="w-[var(--radix-popper-anchor-width)] p-2 z-50">
                          <div className="space-y-1">
                            {['North', 'East', 'South', 'West', 'Northeast', 'Southeast', 'Southwest', 'Northwest'].map((orientation) => (
                              <div key={orientation} className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent cursor-pointer">
                                <Checkbox
                                  id={`orientation-${orientation}`}
                                  checked={orientationSelected.includes(orientation)}
                                  onCheckedChange={(checked) => {
                                    const isChecked = Boolean(checked);
                                    setOrientationSelected(isChecked
                                      ? [...orientationSelected, orientation]
                                      : orientationSelected.filter((o) => o !== orientation)
                                    );
                                  }}
                                />
                                <Label htmlFor={`orientation-${orientation}`}>{orientation}</Label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Other Features */}
                    <div className="space-y-2">
                      <Label>Other Features</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" className="w-full justify-between text-left font-normal">
                            {otherFeaturesSelected.length ? `${otherFeaturesSelected.length} selected` : 'Select features'}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="w-[var(--radix-popper-anchor-width)] p-2 z-50">
                          <div className="space-y-1">
                            {['Balcony', 'Garden', 'Elevator', 'Private yard', 'Parking', 'Swimming pool', 'Sauna', 'Terrace'].map((feature) => (
                              <div key={feature} className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent cursor-pointer">
                                <Checkbox
                                  id={`feature-${feature}`}
                                  checked={otherFeaturesSelected.includes(feature)}
                                  onCheckedChange={(checked) => {
                                    const isChecked = Boolean(checked);
                                    setOtherFeaturesSelected(isChecked
                                      ? [...otherFeaturesSelected, feature]
                                      : otherFeaturesSelected.filter((f) => f !== feature)
                                    );
                                  }}
                                />
                                <Label htmlFor={`feature-${feature}`}>{feature}</Label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Condition */}
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" className="w-full justify-between text-left font-normal">
                            {conditionSelected.length ? `${conditionSelected.length} selected` : 'Select condition'}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="w-[var(--radix-popper-anchor-width)] p-2 z-50">
                          <div className="space-y-1">
                            {['Excellent', 'Good', 'Nearly new', 'Recently renovated', 'Needs renovation'].map((condition) => (
                              <div key={condition} className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent cursor-pointer">
                                <Checkbox
                                  id={`condition-${condition}`}
                                  checked={conditionSelected.includes(condition)}
                                  onCheckedChange={(checked) => {
                                    const isChecked = Boolean(checked);
                                    setConditionSelected(isChecked
                                      ? [...conditionSelected, condition]
                                      : conditionSelected.filter((c) => c !== condition)
                                    );
                                  }}
                                />
                                <Label htmlFor={`condition-${condition}`}>{condition}</Label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
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