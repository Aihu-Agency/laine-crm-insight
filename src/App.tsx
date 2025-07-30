
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

const AddClientPage = () => {
  const location = useLocation();
  const initialData = location.state?.initialData;
  const isEditing = location.state?.isEditing || false;
  
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/add" element={<AddClientPage />} />
          <Route path="/customers/:id" element={<CustomerView />} />
          <Route path="/sales-funnel" element={<SalesFunnel />} />
          <Route path="/rental" element={<Rental />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
