import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { airtableApi } from "@/services/airtableApi";
import { CustomerAction } from "@/types/airtable";
import { toast } from "@/hooks/use-toast";
import { Check, Calendar, User } from "lucide-react";

interface TodoProps {
  onLogout?: () => void;
}

const Todo = ({ onLogout }: TodoProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Use server-side filtering for non-admin users
  const shouldUseServerFiltering = !isAdmin && userFullName;
  
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => airtableApi.getAllCustomers(),
    staleTime: 5 * 60 * 1000,
    enabled: !shouldUseServerFiltering, // Only fetch all customers if admin
  });

  const { data: pendingActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ['pending-actions', userFullName, shouldUseServerFiltering],
    queryFn: async () => {
      if (shouldUseServerFiltering && userFullName) {
        // Use server-side filtering for non-admin users
        return airtableApi.getPendingActionsBySalesperson(userFullName);
      }
      return airtableApi.getAllPendingActions();
    },
    enabled: !profileLoading, // Wait for profile to load before fetching
  });

  const isLoading = customersLoading || actionsLoading || profileLoading;

  // Don't show data until user profile is loaded to prevent flashing
  const isDataReady = !profileLoading && !actionsLoading && (userFullName !== null || userFirstName !== null || isAdmin);

  // Create list of actions with customer data
  // When using server-side filtering, actions are already filtered
  const actionsWithCustomers = shouldUseServerFiltering
    ? pendingActions.map(action => ({
        action,
        customer: { id: action.customerId } as any // Placeholder when using server-side filtering
      }))
    : pendingActions
        .map(action => {
          const customer = customers.find(c => c.id === action.customerId);
          return customer && !customer.archived ? { action, customer } : null;
        })
        .filter(Boolean) as Array<{ action: CustomerAction; customer: any }>;

  // Filter and sort actions
  // When using server-side filtering, actions are already filtered by salesperson
  const filteredActions = shouldUseServerFiltering
    ? actionsWithCustomers.sort((a, b) => {
        const da = new Date(a.action.actionDate);
        const db = new Date(b.action.actionDate);
        return da.getTime() - db.getTime();
      })
    : actionsWithCustomers
        .filter(({ customer }) => {
          // Admins see all actions
          if (isAdmin) return true;
          
          // Non-admins only see their own
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

  const handleMarkDone = (actionId: string) => {
    markDoneMutation.mutate(actionId);
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Scheduled Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All your scheduled tasks are listed here
          </p>
        </div>

        {!isDataReady ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Loading tasks...</div>
            </CardContent>
          </Card>
        ) : filteredActions.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                No scheduled tasks found
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredActions.map(({ action, customer }) => (
              <Card key={action.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Customer Name */}
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <button
                          onClick={() => handleCustomerClick(customer.id)}
                          className="font-semibold text-lg hover:underline"
                        >
                          {`${customer.firstName} ${customer.lastName}`.trim()}
                        </button>
                        {customer.salesperson && (
                          <Badge variant="secondary" className="text-xs">
                            {customer.salesperson}
                          </Badge>
                        )}
                      </div>

                      {/* Action Description */}
                      <div className="flex items-start gap-2">
                        <div className="text-gray-700">
                          {action.actionDescription || 'No description'}
                        </div>
                      </div>

                      {/* Task Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Due: {new Date(action.actionDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Customer Contact Info */}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {customer.phone && <span>📞 {customer.phone}</span>}
                        {customer.email && <span>✉️ {customer.email}</span>}
                      </div>
                    </div>

                    {/* Mark Done Button */}
                    <Button
                      onClick={() => handleMarkDone(action.id)}
                      disabled={markDoneMutation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Mark Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {!isLoading && filteredActions.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredActions.length} scheduled task{filteredActions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default Todo;
