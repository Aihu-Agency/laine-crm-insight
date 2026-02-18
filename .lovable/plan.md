
# Fix: Three Reported Issues

## Summary of Bugs Found

Three separate bugs have been identified through code analysis:

---

## Bug 1: New customers not appearing in Funnel or Customer List

**Root Cause:** In `AddClientForm.tsx`, after successfully creating or updating a customer, the code invalidates the React Query cache key `['customers']`. However, the Sales Funnel uses the key `['customers-funnel']`, the Customer List uses `['customers-page']`, and the Tasks card uses `['customers-all']`. None of these match, so those views never refresh their data after a save.

**Fix:** Update the `onSuccess` handlers in `AddClientForm.tsx` to also invalidate `['customers-funnel']`, `['customers-page']`, `['customers-all']`, and `['customers-all-navigation']`.

---

## Bug 2: Filter state lost when navigating back from a customer

**Root Cause:** The `filters` state in `SalesFunnel.tsx` and `Customers.tsx` is stored in React component state (`useState`). When a user clicks into a customer (`/customers/:id`) and uses the browser back button or the back arrow, React Router unmounts the page component and remounts it fresh, resetting `useState` to its initial values (no filter). The filters are lost every time.

**Fix:** Persist filter state in `sessionStorage`. When the component mounts, it will read any previously saved filters from `sessionStorage` and restore them. When filters change, they will be saved. This is transparent to the user — filters will survive navigation and be cleared only when the user explicitly clicks "Clear filters".

This will be implemented as a small reusable custom hook (`usePersistedFilters`) to keep both pages clean and consistent.

---

## Bug 3: Tasks not appearing on Tommi's dashboard

**Root Cause:** In `ActionRequiredCard.tsx` (and `Todo.tsx`), the logic for filtering tasks by salesperson compares the user's full name from the Supabase `profiles` table against the `Sales person` field stored in Airtable. If there is any case mismatch, accent difference, or spelling difference between the two (e.g., "Tommi Tuominen" in profiles vs a slightly different format in Airtable), the name comparison fails silently and no tasks appear.

The current server-side filtering path sends the full name to the edge function, which does an **exact string match** (`f['Sales person'] === salespersonParam`). Any difference — even a single space — causes 0 results.

**Fix:** Make the name matching case-insensitive and trim-safe in the edge function (`airtable-proxy/index.ts`). Change the comparison from strict `===` to a normalized comparison (lowercase + trim on both sides). Also add a fallback: if the server-side filter returns 0 results, also include the result from a first-name-only match so that a salesperson like "Tommi" will still see their tasks even if there is a minor name discrepancy.

---

## Files to Change

### 1. `src/components/AddClientForm.tsx`
- In `createCustomerMutation.onSuccess`: add invalidation for `['customers-funnel']`, `['customers-page']`, `['customers-all']`, `['customers-all-navigation']`
- In `updateCustomerMutation.onSuccess`: same additional invalidations

### 2. `src/hooks/usePersistedFilters.ts` (new file)
- A small custom hook that wraps `useState` with `sessionStorage` read/write
- Takes a storage key and default value, returns `[value, setValue]`

### 3. `src/pages/SalesFunnel.tsx`
- Replace the `filters` useState with `usePersistedFilters('sales-funnel-filters', defaultFilters)`
- No other logic changes needed

### 4. `src/pages/Customers.tsx`
- Replace the `filters` useState with `usePersistedFilters('customers-filters', defaultFilters)`

### 5. `supabase/functions/airtable-proxy/index.ts`
- In the salesperson filtering section (line ~198), change the exact match to a case-insensitive, trimmed comparison:
  ```
  // Before
  return f['Sales person'] === salespersonParam
  // After  
  return (f['Sales person'] || '').trim().toLowerCase() === salespersonParam.trim().toLowerCase()
  ```
- This fixes the task visibility issue for any salesperson whose name has minor formatting differences between Supabase and Airtable

---

## Technical Notes

- The `usePersistedFilters` hook uses `sessionStorage` (not `localStorage`) so filters are naturally cleared when the browser tab is closed — appropriate for a CRM session context
- The edge function fix is a server-side change and requires redeployment of `airtable-proxy`
- No database schema changes are needed
- No new dependencies are required
