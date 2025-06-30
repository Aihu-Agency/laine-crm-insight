
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const navItems = [
    { name: "Dashboard", active: true },
    { name: "Sales Funnel", active: false },
    { name: "Customers", active: false },
    { name: "Rental", active: false },
    { name: "ToDo", active: false },
    { name: "Settings", active: false },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-primary">Laine Homes</h1>
            <span className="text-sm text-muted-foreground">CRM</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={item.active ? "default" : "ghost"}
              className={`${
                item.active 
                  ? "bg-primary text-white" 
                  : "text-gray-600 hover:text-primary hover:bg-laine-grey"
              }`}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
