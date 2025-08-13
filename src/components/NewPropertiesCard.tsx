
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const NewPropertiesCard = () => {
  const navigate = useNavigate();
  
  const newProperties = [
    {
      name: "Mikko Tuominen",
      count: "2 new properties"
    },
    {
      name: "Otso Lindfors",
      count: "2 new properties"
    },
    {
      name: "Tiina Källi",
      count: "1 new properties"
    },
    {
      name: "Tommi Perälä",
      count: "1 new properties"
    }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-800">
          New properties available
        </CardTitle>
        <span className="text-xs text-muted-foreground">Work In Progress</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {newProperties.map((item, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center py-3 px-4 bg-laine-beige rounded-lg hover:bg-laine-beige/80 transition-colors duration-200 cursor-pointer"
              onClick={() => item.name === "Mikko Tuominen" && navigate("/customers/1")}
            >
              <span className="font-medium text-gray-800">{item.name}</span>
              <span className="text-sm text-gray-600">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NewPropertiesCard;
