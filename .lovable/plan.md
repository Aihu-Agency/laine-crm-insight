

# Fix: Dashboard Task Names, User Filtering, and Empty Sales Funnel

## Three Root Causes

### 1. Sales Funnel Returns Empty (Critical)
The Airtable table has no field called `"Created"`. The sort parameter `sort[0][field]=Created` causes a 422 error from Airtable, returning zero records. The edge function logs confirm: `Unknown field name: "Created"`.

**Fix:** Remove the sort parameters from `getCustomers()` in `src/services/airtableApi.ts`. Airtable returns records in creation order by default (newest last), which is acceptable. Alternatively, we could sort by an existing field, but removing the broken sort is the priority to unblock the funnel.

### 2. Dashboard Shows Airtable Row IDs Instead of Customer Names
The `getAllPendingActions()` method (used for admins and the "show everyone" mode) fetches actions through a generic GET path in the edge function that does NOT enrich records with `_customerName` or `_customerSalesperson`. Only the `salesperson`-filtered path enriches data.

**Fix:** Add a new server-side path in `airtable-proxy/index.ts` for fetching all pending actions with enrichment. When the query parameter `allPending=true` is passed, fetch all customers, fetch all actions, filter to pending, and enrich each action with customer name and salesperson -- same pattern as the salesperson path but without the salesperson filter. Update `getAllPendingActions()` in `airtableApi.ts` to use this new parameter.

### 3. Dashboard Shows All Tasks for Admin Users
The `shouldUseServerFiltering` condition is `!showEveryone && !isAdmin && userFullName`. This means admins always see ALL actions (even when "Show everyone" is off). When an admin has `showEveryone=false`, they should see only their own tasks.

**Fix:** Change the condition in `ActionRequiredCard.tsx` so admins with `showEveryone=false` also use server-side salesperson filtering. The condition becomes: `!showEveryone && userFullName` (remove `!isAdmin`).

---

## Files to Modify

| File | Change |
|------|--------|
| `src/services/airtableApi.ts` | Remove `sort[0][field]=Created` params from `getCustomers()`. Update `getAllPendingActions()` to pass `allPending=true` parameter. |
| `supabase/functions/airtable-proxy/index.ts` | Add `allPending` query parameter handling in the customer-actions GET path -- fetch all customers + actions, filter pending, enrich with names. |
| `src/components/ActionRequiredCard.tsx` | Change `shouldUseServerFiltering` to `!showEveryone && userFullName` so admins also get filtered by their name when toggle is off. |

