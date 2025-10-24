
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
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const normalizeName = (s?: string | null) =>
    (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Load user profile information (parallelized for speed)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserFullName(null);
          setUserFirstName(null);
          setIsAdmin(false);
          setProfileLoading(false);
          return;
        }

        // Parallelize all profile data fetching
        const [adminCheck, profileData] = await Promise.all([
          supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
          supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
        ]);

        setIsAdmin(adminCheck.data || false);

        if (!profileData.error && profileData.data) {
          const first = profileData.data.first_name || null;
          const last = profileData.data.last_name || null;
          const full = `${first || ''} ${last || ''}`.trim() || null;
          setUserFirstName(first);
          setUserFullName(full);
        } else {
          const metaFirst = (user.user_metadata?.first_name as string) || null;
          const metaLast = (user.user_metadata?.last_name as string) || null;
          const fullMeta = `${metaFirst || ''} ${metaLast || ''}`.trim() || null;
          setUserFirstName(metaFirst);
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

  // Use server-side filtering when not showing everyone and not admin
  const shouldUseServerFiltering = !showEveryone && !isAdmin && userFullName;
  
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => airtableApi.getAllCustomers(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: pendingActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ['pending-actions', userFullName, shouldUseServerFiltering],
    queryFn: async () => {
      if (shouldUseServerFiltering && userFullName) {
        // Use server-side filtering for better performance
        return airtableApi.getPendingActionsBySalesperson(userFullName);
      }
      return airtableApi.getAllPendingActions();
    },
    enabled: !profileLoading, // Wait for profile to load before fetching
  });

  const isLoading = customersLoading || actionsLoading || profileLoading;

  // Don't show data until user profile is loaded to prevent flashing
  const isDataReady = !profileLoading && !actionsLoading && (userFullName !== null || userFirstName !== null || isAdmin);

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

  // Create customer data with their earliest pending action
  const customersWithActions = Array.from(customerActionMap.entries())
    .map(([customerId, action]) => {
      const customer = customers.find(c => c.id === customerId);
      // Filter out archived customers
      return customer && !customer.archived ? { customer, action } : null;
    })
    .filter(Boolean) as Array<{ customer: any; action: CustomerAction }>;

  // Filter and sort actions
  // When using server-side filtering, actions are already filtered by salesperson
  const filteredSorted = shouldUseServerFiltering
    ? customersWithActions.sort((a, b) => {
        const da = new Date(a.action.actionDate);
        const db = new Date(b.action.actionDate);
        return da.getTime() - db.getTime();
      })
    : customersWithActions
        .filter(({ customer }) => {
          // Admins can see all or filter by showEveryone toggle
          // Non-admins only see their own tasks
          if (isAdmin && showEveryone) return true;
          const sp = normalizeName(customer.salesperson);
          const hasName = !!userFullName || !!userFirstName;
          if (!hasName) return true;
          const full = normalizeName(userFullName);
          const first = normalizeName(userFirstName);
          return sp === full || sp === first;
        })
        .sort((a, b) => {
          const da = new Date(a.action.actionDate);
          const db = new Date(b.action.actionDate);
          return da.getTime() - db.getTime();
        });

  const visible = filteredSorted.slice(0, limit);

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
            {visible.map(({ customer, action }) => (
              <div
                key={customer.id}
                className="flex justify-between items-center py-3 px-4 rounded-lg transition-colors hover:bg-accent group"
              >
                <div 
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={() => handleCustomerClick(customer.id)}
                >
                  <span className="font-medium">{`${customer.firstName} ${customer.lastName}`.trim()}</span>
                  {customer.salesperson && (
                    <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                      {customer.salesperson}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span 
                    className="text-sm text-muted-foreground cursor-pointer"
                    onClick={() => handleCustomerClick(customer.id)}
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
        {filteredSorted.length > limit && (
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
