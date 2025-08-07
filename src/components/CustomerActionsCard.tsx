import { useState } from "react";
import { format } from "date-fns";
import { Plus, Calendar, CheckCircle, Clock, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtableApi } from "@/services/airtableApi";
import { CustomerAction } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";

interface CustomerActionsCardProps {
  customerId: string;
}

export const CustomerActionsCard = ({ customerId }: CustomerActionsCardProps) => {
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [actionDescription, setActionDescription] = useState("");
  const [actionDate, setActionDate] = useState<Date>();
  const queryClient = useQueryClient();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['customer-actions', customerId],
    queryFn: () => airtableApi.getCustomerActions(customerId),
    enabled: !!customerId,
  });

  const createActionMutation = useMutation({
    mutationFn: ({ customerId, actionData }: { customerId: string; actionData: { actionDescription: string; actionDate: string } }) =>
      airtableApi.createCustomerAction(customerId, actionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-actions', customerId] });
      toast({
        title: "Success",
        description: "Customer action created successfully",
      });
      setIsAddingAction(false);
      setActionDescription("");
      setActionDate(undefined);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create customer action",
        variant: "destructive",
      });
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: (actionId: string) => airtableApi.markActionAsCompleted(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-actions', customerId] });
      toast({
        title: "Success",
        description: "Action marked as completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark action as completed",
        variant: "destructive",
      });
    },
  });

  const handleAddAction = () => {
    if (actionDescription && actionDate) {
      createActionMutation.mutate({
        customerId,
        actionData: {
          actionDescription,
          actionDate: format(actionDate, 'yyyy-MM-dd'),
        }
      });
    }
  };

  const handleMarkCompleted = (actionId: string) => {
    markCompletedMutation.mutate(actionId);
  };

  const pendingActions = actions.filter(action => !action.completed);
  const completedActions = actions.filter(action => action.completed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Actions</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddingAction(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Action
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading actions...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add new action form */}
            {isAddingAction && (
              <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                <div>
                  <label className="text-sm font-medium text-gray-700">Action Description</label>
                  <Input
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    placeholder="Enter action description..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Action Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <Calendar className="mr-2 h-4 w-4" />
                        {actionDate ? format(actionDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={actionDate}
                        onSelect={setActionDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddAction} 
                    size="sm"
                    disabled={!actionDescription || !actionDate || createActionMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Action
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsAddingAction(false);
                      setActionDescription("");
                      setActionDate(undefined);
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Pending Actions</h4>
                <div className="space-y-2">
                  {pendingActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium">{action.actionDescription}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Due: {format(new Date(action.actionDate), "PPP")}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleMarkCompleted(action.id)}
                        variant="outline"
                        size="sm"
                        disabled={markCompletedMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Done
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Actions */}
            {completedActions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Completed Actions</h4>
                <div className="space-y-2">
                  {completedActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">{action.actionDescription}</span>
                          <Badge variant="secondary" className="ml-2">Done</Badge>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Completed: {format(new Date(action.actionDate), "PPP")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No actions message */}
            {actions.length === 0 && !isAddingAction && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Actions Scheduled</h3>
                <p className="text-gray-500 mb-4">Start by adding your first customer action.</p>
                <Button onClick={() => setIsAddingAction(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Action
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};