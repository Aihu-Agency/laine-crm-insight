
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { airtableApi } from "@/services/airtableApi";
import { CustomerAction } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

const ActionRequiredCard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showEveryone, setShowEveryone] = useState(false);
  const [limit, setLimit] = useState(10);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Load user profile information (parallelized for speed)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserFullName(null);
          setIsAdmin(false);
          setProfileLoading(false);
          return;
        }

        const [adminCheck, profileData] = await Promise.all([
          supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
          supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
        ]);

        setIsAdmin(adminCheck.data || false);

        if (!profileData.error && profileData.data) {
          const first = profileData.data.first_name || null;
          const last = profileData.data.last_name || null;
          const full = `${first || ''} ${last || ''}`.trim() || null;
          setUserFullName(full);
        } else {
          const metaFirst = (user.user_metadata?.first_name as string) || null;
          const metaLast = (user.user_metadata?.last_name as string) || null;
          const fullMeta = `${metaFirst || ''} ${metaLast || ''}`.trim() || null;
          setUserFullName(fullMeta);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Determine query mode
  const shouldUseServerFiltering = !showEveryone && !isAdmin && userFullName;

  const { data: pendingActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ['pending-actions', userFullName, shouldUseServerFiltering, showEveryone],
    queryFn: async () => {
      if (shouldUseServerFiltering && userFullName) {
        return airtableApi.getPendingActionsBySalesperson(userFullName);
      }
      return airtableApi.getAllPendingActions();
    },
    enabled: !profileLoading,
  });

  const isLoading = actionsLoading || profileLoading;
  const isDataReady = !profileLoading && !actionsLoading;

  // Group pending actions by customer ID and get the earliest action for each customer
  const customerActionMap = new Map<string, CustomerAction>();
  
  pendingActions.forEach(action => {
    if (action.customerId) {
      const existing = customerActionMap.get(action.customerId);
      if (!existing || new Date(action.actionDate) < new Date(existing.actionDate)) {
        customerActionMap.set(action.customerId, action);
      }
    }
  });

  // Build display list from enriched action data (no separate customer fetch needed for server-filtered)
  const actionsWithDisplay = Array.from(customerActionMap.entries())
    .map(([customerId, action]) => ({
      customerId,
      action,
      displayName: action.customerName || customerId,
      salesperson: action.customerSalesperson || '',
    }))
    .sort((a, b) => {
      const da = new Date(a.action.actionDate);
      const db = new Date(b.action.actionDate);
      return da.getTime() - db.getTime();
    });

  const visible = actionsWithDisplay.slice(0, limit);

  const handleShowMore = () => {
    setLimit((l) => l + 20);
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const markDoneMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return airtableApi.markActionAsCompleted(actionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-actions'] });
      toast({
        title: "Success",
        description: "Action marked as done",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark action as done",
        variant: "destructive",
      });
    },
  });

  const handleMarkDone = (e: React.MouseEvent, actionId: string) => {
    e.stopPropagation();
    markDoneMutation.mutate(actionId);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Tasks
        </CardTitle>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEveryone((v) => !v)}
            aria-label={showEveryone ? "Show my Actions" : "Show everyone's Actions"}
          >
            {showEveryone ? "Show my Actions" : "Show everyone's Actions"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!isDataReady ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="text-sm text-muted-foreground">No upcoming tasks</div>
        ) : (
          <div className="space-y-3">
            {visible.map(({ customerId, action, displayName, salesperson }) => (
              <div
                key={customerId}
                className="flex justify-between items-center py-3 px-4 rounded-lg transition-colors hover:bg-accent group"
              >
                <div 
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={() => handleCustomerClick(customerId)}
                >
                  <span className="font-medium">{displayName}</span>
                  {salesperson && (
                    <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                      {salesperson}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span 
                    className="text-sm text-muted-foreground cursor-pointer"
                    onClick={() => handleCustomerClick(customerId)}
                  >
                    {action.actionDescription ? `${action.actionDescription} • ` : ""}
                    {action.actionDate ? new Date(action.actionDate).toLocaleDateString() : ""}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleMarkDone(e, action.id)}
                    disabled={markDoneMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Done
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {actionsWithDisplay.length > limit && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline"
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
