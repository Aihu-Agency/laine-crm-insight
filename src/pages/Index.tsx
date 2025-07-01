
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "@/components/LoginPage";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div>
      <LoginPage onLogin={handleLogin} />
    </div>
  );
};

export default Index;
