
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
    <Card className="opacity-60 pointer-events-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-600">
          New properties available
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-base font-medium text-gray-600">
            This feature will be soon LIVE
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewPropertiesCard;
