
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerFiltersValue } from "@/types/filters";

interface CustomerFiltersProps {
  value: CustomerFiltersValue;
  onChange: (next: CustomerFiltersValue) => void;
  onClear: () => void;
}

const CustomerFilters = ({ value, onChange, onClear }: CustomerFiltersProps) => {
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
          return [fn, ln].filter(Boolean).join(' ').trim() || 'Unknown';
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
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Select key={`location-${value.location ?? 'empty'}`} value={value.location || undefined} onValueChange={(v) => onChange({ ...value, location: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="Marbella">Marbella</SelectItem>
              <SelectItem value="Puerto Banus">Puerto Banus</SelectItem>
              <SelectItem value="Malaga">Malaga</SelectItem>
              <SelectItem value="Fuengirola">Fuengirola</SelectItem>
              <SelectItem value="Mijas">Mijas</SelectItem>
              <SelectItem value="Torremolinos">Torremolinos</SelectItem>
              <SelectItem value="Alhaurin">Alhaurin</SelectItem>
              <SelectItem value="Benahavís">Benahavís</SelectItem>
              <SelectItem value="Estepona">Estepona</SelectItem>
              <SelectItem value="Mijas Costa">Mijas Costa</SelectItem>
              <SelectItem value="Nueva Andalucía">Nueva Andalucía</SelectItem>
              <SelectItem value="Costa del Sol other">Costa del Sol other</SelectItem>
              <SelectItem value="Torrevieja">Torrevieja</SelectItem>
              <SelectItem value="Costa Blanca other">Costa Blanca other</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Salesperson</Label>
          <Select key={`salesperson-${value.salesperson ?? 'empty'}`} value={value.salesperson || undefined} onValueChange={(v) => onChange({ ...value, salesperson: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select salesperson" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="__all__">Everyone</SelectItem>
              {loadingSP ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (salespeople.length ? (
                salespeople.map((name, idx) => (
                  <SelectItem key={`${name}-${idx}`} value={name}>{name}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No salespeople</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Time of Purchase</Label>
          <Select key={`time-${value.timeOfPurchase ?? 'empty'}`} value={value.timeOfPurchase || undefined} onValueChange={(v) => onChange({ ...value, timeOfPurchase: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="1-3 months">1-3 months</SelectItem>
              <SelectItem value="3-6 months">3-6 months</SelectItem>
              <SelectItem value="6-12 months">6-12 months</SelectItem>
              <SelectItem value="Later">Later</SelectItem>
              <SelectItem value="Property shown">Property shown</SelectItem>
              <SelectItem value="Unclear">Unclear</SelectItem>
              <SelectItem value="__not_specified__">Not specified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-start">
        <Button variant="outline" className="text-gray-600" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    </div>
  );
};

export default CustomerFilters;
