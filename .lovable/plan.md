

# Fix Plan: Multi-select Filters, Bedrooms/Bathrooms, and Dashboard Performance

## Issues from tester feedback

1. **Funnel location filter should be multi-select** — currently a single-select dropdown
2. **Bedrooms should be multi-select, bathrooms should use "1+, 2+, 3+" format** — currently both are single-select in AddClientForm
3. **Funnel visibility still intermittent** — the `buildFilterFormula` for location uses exact `FIND` on a single value; needs to handle multiple selected locations
4. **Dashboard task list loads very slowly** — `ActionRequiredCard` fetches ALL customers via `getAllCustomers()` (paginating through 1800+ records from Airtable) AND all pending actions, then joins them client-side. The `getAllCustomers` call alone requires ~18 paginated API requests

---

## Changes

### 1. Multi-select Location filter

**Files:** `src/types/filters.ts`, `src/components/CustomerFilters.tsx`, `src/components/CustomerList.tsx`, `src/pages/SalesFunnel.tsx`

- Change `location: string` to `location: string[]` in `CustomerFiltersValue`
- Replace the single-select Location dropdown in `CustomerFilters` with a multi-select popover (checkbox list, same pattern used for Source of Contact in AddClientForm)
- Update `buildFilterFormula()` in both `CustomerList.tsx` and `SalesFunnel.tsx` to generate an `OR(FIND(...), FIND(...))` formula when multiple locations are selected
- Update `handleClearFilters` to reset location to `[]`

### 2. Bedrooms multi-select + Bathrooms "1+, 2+, 3+" format

**File:** `src/components/AddClientForm.tsx`

- **Bedrooms**: Change from single `Select` to a checkbox group (multi-select). Change state from `number | undefined` to `string[]`. Update Airtable field mapping to pass the array directly (Airtable `Bedrooms` field already accepts `string[]` like `['1', '2', '4+']`)
- **Bathrooms**: Change options from `['1', '2', '3+']` to `['1+', '2+', '3+']`. Change state from `number | undefined` to `string[]`. Update Airtable field mapping similarly
- Update `handleSubmit` to pass arrays instead of single values
- Update `airtableApi.ts` create/update methods: remove the wrapping logic that converts numbers to `[str]` — pass arrays directly

### 3. Dashboard task list performance

**File:** `src/components/ActionRequiredCard.tsx`

The root cause is two expensive queries running in parallel:
- `getAllCustomers()` — fetches ALL 1800+ customers (18+ Airtable API calls)
- `getAllPendingActions()` or `getPendingActionsBySalesperson()` — fetches all actions

The `getAllCustomers` call is only used to look up customer names for display. But the server-side `getPendingActionsBySalesperson` already returns actions linked to the right customers.

**Fix approach:**
- Remove the `getAllCustomers` query from `ActionRequiredCard`
- Modify the edge function's salesperson-filtered response to include customer name data (first name, last name, salesperson) inline in each action record, so the frontend doesn't need a second round-trip
- In the edge function, after filtering actions by salesperson's customer IDs, enrich each action record with customer name from the already-fetched customer records
- On the frontend, use the enriched data directly instead of joining against a full customer list

**Files:** `supabase/functions/airtable-proxy/index.ts`, `src/components/ActionRequiredCard.tsx`, `src/services/airtableApi.ts`, `src/types/airtable.ts`

- Edge function: After filtering actions, attach `_customerName` and `_salesperson` to each action's fields from the customer records already in memory
- Add `customerName` and `customerSalesperson` to `CustomerAction` type
- Update `transformAirtableCustomerAction` to read these enriched fields
- Simplify `ActionRequiredCard` to use action data directly without the customer lookup query

### 4. Funnel visibility fix

The current Airtable `FIND` filter for location does an exact substring match which can miss records. With multi-select locations, the formula will use `OR(FIND("loc1", ...), FIND("loc2", ...))` which is more robust. This combined with the filter persistence fix from the previous round should resolve the intermittent visibility issue.

---

## Files to modify

| File | Change |
|------|--------|
| `src/types/filters.ts` | `location: string` → `location: string[]` |
| `src/components/CustomerFilters.tsx` | Replace location Select with multi-select checkbox popover |
| `src/components/CustomerList.tsx` | Update `buildFilterFormula` for array locations |
| `src/pages/SalesFunnel.tsx` | Update `buildFilterFormula` for array locations, update default filters |
| `src/components/AddClientForm.tsx` | Bedrooms → multi-select checkboxes, Bathrooms → "1+/2+/3+" checkboxes |
| `src/services/airtableApi.ts` | Simplify bedrooms/bathrooms mapping to pass arrays directly |
| `src/types/airtable.ts` | Add enriched fields to CustomerAction |
| `src/components/ActionRequiredCard.tsx` | Remove `getAllCustomers` query, use enriched action data |
| `supabase/functions/airtable-proxy/index.ts` | Enrich action records with customer name data |

