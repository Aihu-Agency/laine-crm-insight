import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Euro, User, Home, Heart, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CustomerData {
  id: number;
  fullName: string;
  phase: string;
  location: string;
  budgetRange: string;
  salesperson: string;
  lastContact: string;
  // Extended customer data
  email?: string;
  phone?: string;
  age?: number;
  nationality?: string;
  occupation?: string;
  familyStatus?: string;
  children?: number;
  // Property preferences
  propertyType?: string[];
  bedrooms?: number[];
  bathrooms?: number[];
  amenities?: string[];
  preferredAreas?: string[];
  // Financial information
  budget?: {
    min: number;
    max: number;
    currency: string;
    financing?: string;
  };
  // Notes and history
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  tags?: string[];
}

const CustomerView = ({ onLogout }: { onLogout?: () => void }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock customer data - in a real app this would come from an API or state management
  const getCustomerData = (customerId: string): CustomerData | null => {
    const customers: CustomerData[] = [
      {
        id: 1,
        fullName: "Mikko Tuominen",
        phase: "0-3 mo",
        location: "Marbella",
        budgetRange: "€300k - €400k",
        salesperson: "Laura",
        lastContact: "2 days ago",
        email: "mikko.tuominen@email.com",
        phone: "+358 40 123 4567",
        age: 45,
        nationality: "Finnish",
        occupation: "Software Engineer",
        familyStatus: "Married",
        children: 2,
        propertyType: ["Apartment", "Villa"],
        bedrooms: [2, 3],
        bathrooms: [2, 3],
        amenities: ["Pool", "Sea view", "Parking"],
        preferredAreas: ["Marbella", "Puerto Banús"],
        budget: {
          min: 300000,
          max: 400000,
          currency: "EUR",
          financing: "Cash purchase"
        },
        notes: "Very interested in sea view properties. Looking for investment opportunity with rental potential.",
        nextAction: "Send property listings matching criteria",
        nextActionDate: "2024-01-15",
        tags: ["High Priority", "Investment", "Cash Buyer"]
      },
      {
        id: 2,
        fullName: "Anna Korhonen",
        phase: "3-6 mo",
        location: "Estepona",
        budgetRange: "€250k - €350k",
        salesperson: "Anna",
        lastContact: "1 week ago",
        email: "anna.korhonen@email.com",
        phone: "+358 50 987 6543",
        age: 38,
        nationality: "Finnish",
        occupation: "Marketing Manager",
        familyStatus: "Single",
        children: 0,
        propertyType: ["Apartment"],
        bedrooms: [1, 2],
        bathrooms: [1, 2],
        amenities: ["Gym", "Pool", "Beach access"],
        preferredAreas: ["Estepona", "San Pedro"],
        budget: {
          min: 250000,
          max: 350000,
          currency: "EUR",
          financing: "Mortgage + cash"
        },
        notes: "First-time buyer in Spain. Needs guidance on legal process and taxes.",
        nextAction: "Schedule legal consultation",
        nextActionDate: "2024-01-20",
        tags: ["First-time buyer", "Legal assistance needed"]
      }
    ];

    return customers.find(c => c.id === parseInt(customerId)) || null;
  };

  const customer = id ? getCustomerData(id) : null;

  if (!customer) {
    return (
      <div className="min-h-screen bg-laine-grey">
        <Navigation onLogout={onLogout} />
        <div className="container mx-auto p-6">
          <Card className="text-center p-8">
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Customer Not Found</h2>
              <p className="text-gray-600 mb-4">The customer you're looking for doesn't exist.</p>
              <Button onClick={() => navigate("/customers")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getPhaseColor = (phase: string) => {
    if (phase.includes("0-3")) return "bg-red-50 text-red-700 border-red-200";
    if (phase.includes("3-6")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (phase.includes("6-12")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate("/customers")} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{customer.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getPhaseColor(customer.phase)} border`}>
                  {customer.phase}
                </Badge>
                {customer.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button>
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-800">{customer.email || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-800">{customer.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Age</label>
                    <p className="text-gray-800">{customer.age || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nationality</label>
                    <p className="text-gray-800">{customer.nationality || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Occupation</label>
                    <p className="text-gray-800">{customer.occupation || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Family Status</label>
                    <p className="text-gray-800">
                      {customer.familyStatus || "Not provided"}
                      {customer.children ? ` (${customer.children} children)` : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Property Type</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.propertyType?.map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      )) || <span className="text-gray-800">Not specified</span>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bedrooms</label>
                    <p className="text-gray-800">
                      {customer.bedrooms?.join(", ") || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bathrooms</label>
                    <p className="text-gray-800">
                      {customer.bathrooms?.join(", ") || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preferred Areas</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.preferredAreas?.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {area}
                        </Badge>
                      )) || <span className="text-gray-800">Not specified</span>}
                    </div>
                  </div>
                </div>
                
                {customer.amenities && customer.amenities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Desired Amenities</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Heart className="w-3 h-3 mr-1" />
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 leading-relaxed">
                  {customer.notes || "No notes available."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Summary and actions */}
          <div className="space-y-6">
            {/* Quick Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Salesperson:</span>
                  <span className="font-medium">{customer.salesperson}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Contact:</span>
                  <span className="font-medium">{customer.lastContact}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="font-medium">{customer.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Budget Range:</span>
                  <span className="font-medium">{customer.budgetRange}</span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.budget && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Budget:</span>
                      <span className="font-medium">
                        €{customer.budget.min.toLocaleString()} - €{customer.budget.max.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Financing:</span>
                      <span className="font-medium">{customer.budget.financing}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Next Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Next Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Next Action</label>
                  <p className="text-gray-800 mt-1">{customer.nextAction || "No action planned"}</p>
                </div>
                {customer.nextActionDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Date</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-800">{customer.nextActionDate}</span>
                    </div>
                  </div>
                )}
                <Button className="w-full mt-4">
                  Schedule Next Action
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerView;