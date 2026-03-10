

## Problem

Creating a new customer is slow because `createCustomer()` fetches **all 1,800+ customers** (paginating through the entire Airtable database) just to determine the next `Customer number`. This causes multiple sequential API calls to Airtable before the actual create request even happens.

## Solution

Replace the `getAllCustomers()` call with a targeted Airtable query that fetches only the single record with the highest `Customer number`, using:
- `sort[0][field]=Customer number` + `sort[0][direction]=desc`
- `pageSize=1`
- `fields[]=Customer number` (only fetch the one field needed)

This reduces the pre-create step from ~20 paginated API calls to **1 lightweight call**.

## Changes

**`src/services/airtableApi.ts`** — Replace lines 79-93 in `createCustomer`:
- Instead of `this.getAllCustomers()`, call `this.makeRequest()` with a query that sorts by `Customer number` descending, limits to 1 record, and only requests that field.
- Extract the max number from the single returned record and increment by 1.

