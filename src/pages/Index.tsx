
import { useState } from "react";
import LoginPage from "@/components/LoginPage";
import Dashboard from "@/components/Dashboard";
import Customers from "@/pages/Customers";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "customers":
        return <Customers onLogout={handleLogout} />;
      case "dashboard":
      default:
        return <Dashboard onLogout={handleLogout} onNavigate={handleNavigation} />;
    }
  };

  return (
    <div>
      {isLoggedIn ? (
        renderCurrentPage()
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default Index;
