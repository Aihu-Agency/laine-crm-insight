
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ActionRequiredCard = () => {
  const [showMoreActions, setShowMoreActions] = useState(false);

  const initialActionRequiredCustomers = [
    {
      name: "Mikko Tuominen",
      action: "Call 14.7.2025",
      priority: "high" as const
    },
    {
      name: "Otso Lindfors", 
      action: "Email 15.7.2025",
      priority: "medium" as const
    },
    {
      name: "Tiina Källi",
      action: "Contact in July",
      priority: "low" as const
    },
    {
      name: "Tommi Perälä",
      action: "Call 14.7.2025 at 13:00",
      priority: "high" as const
    },
    {
      name: "Tiina Källi",
      action: "Not contacted in 3 months",
      priority: "medium" as const
    }
  ];

  const additionalActionRequiredCustomers = [
    {
      name: "Marja Virtanen",
      action: "Schedule meeting 16.7.2025",
      priority: "high" as const
    },
    {
      name: "Jukka Nieminen",
      action: "Send property list",
      priority: "medium" as const
    },
    {
      name: "Anna Korhonen",
      action: "Follow up on proposal",
      priority: "high" as const
    },
    {
      name: "Petri Hakala",
      action: "Call 17.7.2025",
      priority: "low" as const
    },
    {
      name: "Sari Laakso",
      action: "Email property details",
      priority: "medium" as const
    },
    {
      name: "Markus Rantala",
      action: "Schedule viewing",
      priority: "high" as const
    },
    {
      name: "Liisa Mäkinen",
      action: "Not contacted in 2 months",
      priority: "medium" as const
    },
    {
      name: "Tero Jokinen",
      action: "Call 18.7.2025 at 10:00",
      priority: "low" as const
    },
    {
      name: "Kirsi Salonen",
      action: "Send contract draft",
      priority: "high" as const
    },
    {
      name: "Ville Heikkinen",
      action: "Follow up on financing",
      priority: "medium" as const
    }
  ];

  const actionRequiredCustomers = showMoreActions 
    ? [...initialActionRequiredCustomers, ...additionalActionRequiredCustomers]
    : initialActionRequiredCustomers;

  const handleShowMore = () => {
    setShowMoreActions(true);
  };

  const getPriorityStyles = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-l-4 border-red-400';
      case 'medium':
        return 'bg-yellow-50 border-l-4 border-yellow-400';
      case 'low':
        return 'bg-laine-blue border-l-4 border-blue-400';
      default:
        return 'bg-laine-blue border-l-4 border-blue-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Action required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actionRequiredCustomers.map((customer, index) => (
            <div 
              key={index} 
              className={`flex justify-between items-center py-3 px-4 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.01] ${getPriorityStyles(customer.priority)}`}
            >
              <span className="font-medium text-gray-800">{customer.name}</span>
              <span className="text-sm text-gray-600">{customer.action}</span>
            </div>
          ))}
        </div>
        {!showMoreActions && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              className="text-primary border-primary hover:bg-primary/10"
              onClick={handleShowMore}
            >
              Show more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionRequiredCard;
