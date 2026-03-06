

# Re-add Sort by Created Field

Now that the `Created` formula field exists in Airtable, re-add the sort parameters to `getCustomers()` so newest customers appear first.

## Change

**File: `src/services/airtableApi.ts`** (line ~29)

Replace the comment `// No sort — Airtable returns records in creation order by default` with:

```ts
params.set('sort[0][field]', 'Created');
params.set('sort[0][direction]', 'desc');
```

This ensures the Sales Funnel shows newest customers on the first page, making them visible without needing to filter by salesperson.

