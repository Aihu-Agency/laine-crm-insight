import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "./Navigation";
import AddClientForm from "./AddClientForm";
import ClientSavedOverlay from "./ClientSavedOverlay";

import ActionRequiredCard from "./ActionRequiredCard";
import AddCustomerCard from "./AddCustomerCard";
import { airtableApi } from "@/services/airtableApi";

interface DashboardProps {
  onLogout?: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [showSavedOverlay, setShowSavedOverlay] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    areaOfInterest: ""
  });

  // Prefetch all customers for faster navigation in CustomerView
  useQuery({
    queryKey: ['customers-all-navigation'],
    queryFn: () => airtableApi.getAllCustomers(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleContinue = () => {
    // Get form values
    const firstNameInput = document.getElementById('customer-firstname') as HTMLInputElement;
    const lastNameInput = document.getElementById('customer-lastname') as HTMLInputElement;
    const areaInput = document.getElementById('area-interest') as HTMLInputElement;
    
    setFormData({
      firstName: firstNameInput?.value || "",
      lastName: lastNameInput?.value || "",
      areaOfInterest: areaInput?.value || ""
    });
    
    setShowAddClientForm(true);
  };

  const handleSaveClient = () => {
    setShowAddClientForm(false);
    setShowSavedOverlay(true);
  };

  const handleCancelClient = () => {
    setShowAddClientForm(false);
  };

  const handleBackToDashboard = () => {
    setShowSavedOverlay(false);
    // Reset form data
    setFormData({
      firstName: "",
      lastName: "",
      areaOfInterest: ""
    });
    // Clear form inputs
    const firstNameInput = document.getElementById('customer-firstname') as HTMLInputElement;
    const lastNameInput = document.getElementById('customer-lastname') as HTMLInputElement;
    const areaInput = document.getElementById('area-interest') as HTMLInputElement;
    
    if (firstNameInput) firstNameInput.value = "";
    if (lastNameInput) lastNameInput.value = "";
    if (areaInput) areaInput.value = "";
  };

  if (showAddClientForm) {
    return (
      <AddClientForm 
        onSave={handleSaveClient}
        onCancel={handleCancelClient}
        initialData={{
          firstName: formData.firstName || "John",
          lastName: formData.lastName || "Doe",
          areasOfInterest: formData.areaOfInterest || ""
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 70% */}
          <div className="lg:col-span-2 space-y-6">
            <ActionRequiredCard />
          </div>

          {/* Right Column - 30% */}
          <div className="space-y-6">
            <AddCustomerCard onContinue={handleContinue} />
          </div>
        </div>
      </div>

      {showSavedOverlay && (
        <ClientSavedOverlay onBackToDashboard={handleBackToDashboard} />
      )}
    </div>
  );
};

export default Dashboard;
