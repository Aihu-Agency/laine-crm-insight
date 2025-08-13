
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddCustomerCardProps {
  onContinue: () => void;
}

const AddCustomerCard = ({ onContinue }: AddCustomerCardProps) => {
  const handleContinue = () => {
    onContinue();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 mb-4">
          Add new customer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-firstname">Customer First Name</Label>
          <Input 
            id="customer-firstname" 
            placeholder="Enter first name"
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-lastname">Customer Last Name</Label>
          <Input 
            id="customer-lastname" 
            placeholder="Enter last name"
            className="w-full"
          />
        </div>
        <Button 
          className="w-full bg-laine-mint hover:bg-laine-mint/90 text-gray-800 border-0"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddCustomerCard;
