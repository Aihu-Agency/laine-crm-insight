

# Fix: Newly Added Customers Not Appearing in Sales Funnel

## Root Causes

Two issues combine to hide new customers:

1. **No sort order on the API call.** Airtable returns records in creation order (oldest first). With pagination at 25 per page, a newly added customer lands on the last page. The user only sees page 1.

2. **Persisted filters may exclude the new customer.** If the user had a salesperson or location filter active before adding the customer, those filters are restored from `sessionStorage` when they return to the funnel. The new customer may not match those filters.

## Fix

### 1. Sort by newest first

Add a `sort[0][field]=Created&sort[0][direction]=desc` parameter to the Airtable query so the most recently created customers appear on page 1.

**File: `src/services/airtableApi.ts`** — In `getCustomers()`, always append sort parameters to the query string so newest records come first.

### 2. Clear filters after creating a new customer

After a successful create, clear the persisted funnel filters from `sessionStorage` so the user sees unfiltered results (and their new customer) when they land on the funnel.

**File: `src/components/AddClientForm.tsx`** — In `createCustomerMutation.onSuccess`, add `sessionStorage.removeItem('sales-funnel-filters')` and `sessionStorage.removeItem('customers-filters')` to reset persisted filters.

### 3. Reduce stale time for funnel query

Change `staleTime` from 60 seconds to 0 in the funnel query so that cache invalidation always triggers a fresh fetch.

**File: `src/pages/SalesFunnel.tsx`** — Set `staleTime: 0` on the customers-funnel query.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/services/airtableApi.ts` | Add sort params (Created, desc) to `getCustomers` |
| `src/components/AddClientForm.tsx` | Clear sessionStorage filters on create success |
| `src/pages/SalesFunnel.tsx` | Set `staleTime: 0` |

