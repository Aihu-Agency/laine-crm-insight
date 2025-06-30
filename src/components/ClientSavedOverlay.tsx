
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientSavedOverlayProps {
  onBackToDashboard: () => void;
}

const ClientSavedOverlay = ({ onBackToDashboard }: ClientSavedOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold text-green-600">
            New client added
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            The client has been successfully added to your database.
          </p>
          <Button 
            onClick={onBackToDashboard}
            className="w-full bg-laine-mint hover:bg-laine-mint/90 text-gray-800"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSavedOverlay;
