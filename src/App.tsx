
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./components/Dashboard";
import Customers from "./pages/Customers";
import CustomerView from "./pages/CustomerView";
import SalesFunnel from "./pages/SalesFunnel";
import Rental from "./pages/Rental";
import Todo from "./pages/Todo";
import Settings from "./pages/Settings";
import AddClientForm from "./components/AddClientForm";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const AddClientPage = () => {
  const location = useLocation();
  const initialData = (location as any).state?.initialData;
  const isEditing = (location as any).state?.isEditing || false;
  
  return (
    <AddClientForm 
      onSave={() => window.history.back()} 
      onCancel={() => window.history.back()}
      initialData={initialData}
      isEditing={isEditing}
    />
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/customers/add" element={<ProtectedRoute><AddClientPage /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerView /></ProtectedRoute>} />
          <Route path="/sales-funnel" element={<ProtectedRoute><SalesFunnel /></ProtectedRoute>} />
          <Route path="/rental" element={<ProtectedRoute><Rental /></ProtectedRoute>} />
          <Route path="/todo" element={<ProtectedRoute><Todo /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
