
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CustomerFilters = () => {
  const [salespeople, setSalespeople] = useState<string[]>([]);
  const [loadingSP, setLoadingSP] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingSP(true);
      const { data, error } = await supabase.rpc('list_salespeople');
      if (!error && isMounted) {
        const names = (data ?? []).map((p: any) => {
          const fn = (p.first_name as string | null) ?? '';
          const ln = (p.last_name as string | null) ?? '';
          return fn.trim() || ln.trim() || 'Unknown';
        });
        setSalespeople(names);
      }
      setLoadingSP(false);
    })();
    return () => { isMounted = false; };
  }, []);
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search by name</Label>
          <Input 
            id="search" 
            placeholder="Enter customer name"
            className="w-full"
          />
        </div>
        
        
        <div className="space-y-2">
          <Label>Location</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marbella">Marbella</SelectItem>
              <SelectItem value="estepona">Estepona</SelectItem>
              <SelectItem value="fuengirola">Fuengirola</SelectItem>
              <SelectItem value="torremolinos">Torremolinos</SelectItem>
              <SelectItem value="benalmadena">Benalmádena</SelectItem>
              <SelectItem value="mijas">Mijas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Salesperson</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select salesperson" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {loadingSP ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (salespeople.length ? (
                salespeople.map((name, idx) => (
                  <SelectItem key={`${name}-${idx}`} value={name.toLowerCase()}>{name}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No salespeople</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-start">
        <Button variant="outline" className="text-gray-600">
          Clear filters
        </Button>
      </div>
    </div>
  );
};

export default CustomerFilters;
