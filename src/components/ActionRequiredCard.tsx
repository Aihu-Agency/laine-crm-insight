
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { airtableApi } from "@/services/airtableApi";
import { CustomerAction } from "@/types/airtable";

const ActionRequiredCard = () => {
  const navigate = useNavigate();

  const [showEveryone, setShowEveryone] = useState(false);
  const [limit, setLimit] = useState(10);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);

  const normalizeName = (s?: string | null) =>
    (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserFullName(null);
        setUserFirstName(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const first = data.first_name || null;
        const last = data.last_name || null;
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
    };
    loadProfile();
  }, []);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => airtableApi.getAllCustomers(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: pendingActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ['pending-actions'],
    queryFn: () => airtableApi.getAllPendingActions(),
  });

  const isLoading = customersLoading || actionsLoading;

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

  const filteredSorted = customersWithActions
    .filter(({ customer }) => {
      if (showEveryone) return true;
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Action required
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEveryone((v) => !v)}
          aria-label={showEveryone ? "Show my Actions" : "Show everyone's Actions"}
        >
          {showEveryone ? "Show my Actions" : "Show everyone’s Actions"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="text-sm text-muted-foreground">No upcoming actions</div>
        ) : (
          <div className="space-y-3">
            {visible.map(({ customer, action }) => (
              <div
                key={customer.id}
                className="flex justify-between items-center py-3 px-4 rounded-lg transition-colors cursor-pointer hover:bg-accent"
                onClick={() => handleCustomerClick(customer.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{`${customer.firstName} ${customer.lastName}`.trim()}</span>
                  {customer.salesperson && (
                    <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                      {customer.salesperson}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {action.actionDescription ? `${action.actionDescription} • ` : ""}
                  {action.actionDate ? new Date(action.actionDate).toLocaleDateString() : ""}
                </span>
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
