
import { Button } from "@/components/ui/button";

interface NavigationProps {
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

const Navigation = ({ onLogout, onNavigate }: NavigationProps) => {
  const handleSettingsClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const navItems = [
    { name: "Dashboard", active: false, onClick: () => handleNavigation("dashboard") },
    { name: "Sales Funnel", active: false, onClick: undefined },
    { name: "Customers", active: false, onClick: () => handleNavigation("customers") },
    { name: "Rental", active: false, onClick: undefined },
    { name: "ToDo", active: false, onClick: undefined },
    { name: "Settings", active: false, onClick: handleSettingsClick },
  ];

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
              onClick={item.onClick}
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
