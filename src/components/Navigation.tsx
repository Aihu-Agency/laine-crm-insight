
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";

interface NavigationProps {
  onLogout?: () => void;
}

const Navigation = ({ onLogout }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const navItems = [
    { name: "Dashboard", path: "/", active: location.pathname === "/" },
    { name: "Sales Funnel", path: "/sales-funnel", active: location.pathname === "/sales-funnel" },
    { name: "Customers", path: "/customers", active: location.pathname === "/customers" },
    { name: "Rental", path: "/rental", active: location.pathname === "/rental" },
    { name: "ToDo", path: "/todo", active: location.pathname === "/todo" },
    { name: "Settings", path: "/settings", active: false, onClick: handleSettingsClick },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.onClick) {
      item.onClick();
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-primary">Laine Homes</h1>
          <span className="text-sm text-muted-foreground">CRM</span>
        </div>
        
        <div className="flex items-center justify-center flex-1 space-x-6">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={item.active ? "default" : "ghost"}
              className={`${
                item.active 
                  ? "bg-primary text-white" 
                  : "text-gray-600 hover:text-primary hover:bg-laine-grey"
              }`}
              onClick={() => handleNavClick(item)}
            >
              {item.name}
            </Button>
          ))}
        </div>
        
        <div className="w-24"></div>
      </div>
    </nav>
  );
};

export default Navigation;
