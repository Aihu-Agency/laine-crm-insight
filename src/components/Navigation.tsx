
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import laineHomesLogo from "@/assets/laine-homes-logo.svg";

interface NavigationProps {
  onLogout?: () => void;
}

const Navigation = ({ onLogout }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", active: location.pathname === "/dashboard" },
    { name: "Sales Funnel", path: "/sales-funnel", active: location.pathname === "/sales-funnel" },
    { name: "Customers", path: "/customers", active: location.pathname === "/customers" },
    { name: "ToDo", path: "/todo", active: location.pathname === "/todo" },
    { name: "Settings", path: "/settings", active: location.pathname === "/settings" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    navigate(item.path);
  };

  return (
    <nav className="bg-laine-navy border-b border-laine-navy/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={laineHomesLogo} alt="Laine Homes" className="h-8" />
          <span className="text-sm text-white/70">CRM</span>
        </div>
        
        <div className="flex items-center justify-center flex-1 space-x-6">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={item.active ? "secondary" : "ghost"}
              className={`${
                item.active 
                  ? "bg-white/10 text-white hover:bg-white/20" 
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              onClick={() => handleNavClick(item)}
            >
              {item.name}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center">
          {onLogout && (
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
