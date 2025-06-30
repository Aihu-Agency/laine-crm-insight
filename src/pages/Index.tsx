
import { useState } from "react";
import LoginPage from "@/components/LoginPage";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // For demo purposes, we'll show the Dashboard by default
  // In production, this would be controlled by actual authentication
  return (
    <div>
      {isLoggedIn ? <Dashboard /> : <Dashboard />}
    </div>
  );
};

export default Index;
