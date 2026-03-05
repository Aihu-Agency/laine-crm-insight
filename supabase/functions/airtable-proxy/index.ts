// Airtable API Proxy Edge Function - Force deployment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AirtableRecord {
  id: string
  fields: {
    'First name': string
    'Last name': string
    'Phone number': string
    'Email': string
    'Phase': string
    'Language': string
    'Customer type': string
    'Customer category': string
    'Time of purchase': string
    'Min price': number
    'Max price': number
    'Areas of interest': string[]
    'Must have': string
    'Nice to have': string
    'Neighborhood or address': string
    'Sales person': string
    'Source of contact': string
    'Last Contact': string
    'Type of apartment': string[]
    'Bedrooms': string[]
    'Bathrooms': string[]
    'Notes': string
    'Next Action Date': string
    'Next Action Type': string
    'Next Action Note': string
    'Tags': string[]
    'Customer number': number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Authentication check ---
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const _supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const _anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const _userClient = createClient(_supabaseUrl, _anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: _claimsData, error: _claimsError } = await _userClient.auth.getClaims(authHeader.replace('Bearer ', ''))
    if (_claimsError || !_claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Parse the request body to get the wrapped data structure
    let requestBody = null
    let actualMethod = req.method
    let actualEndpoint = ''
    
    if (req.method === 'POST') {
      try {
        requestBody = await req.json()
        console.log('[Airtable Proxy] Received request body:', requestBody)
        
        // Check if this is the wrapped format from the frontend
        if (requestBody && typeof requestBody === 'object' && 'endpoint' in requestBody && 'method' in requestBody) {
          actualMethod = requestBody.method
          actualEndpoint = requestBody.endpoint
          requestBody = requestBody.data
          console.log('[Airtable Proxy] Unwrapped request - Method:', actualMethod, 'Endpoint:', actualEndpoint, 'Data:', requestBody)
        }
      } catch (e) {
        console.log('[Airtable Proxy] Could not parse request body as JSON, treating as direct data')
      }
    }

    const url = new URL(req.url)
    const path = actualEndpoint || url.pathname.replace('/airtable-proxy', '')

    console.log(`[Airtable Proxy] ${actualMethod} request to path: ${path}`)
    console.log('[Airtable Proxy] Full URL:', req.url)
    console.log('[Airtable Proxy] Request headers:', Object.fromEntries(req.headers.entries()))

    // Get Airtable credentials from Supabase secrets
    const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')
    const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')

    console.log('[Airtable Proxy] Credentials present:', { hasApiKey: !!AIRTABLE_API_KEY, hasBaseId: !!AIRTABLE_BASE_ID })

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('[Airtable Proxy] Missing credentials')
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Airtable Proxy] Credentials found, proceeding with request')

    const airtableHeaders = {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }

    let airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Customers`
    
    // Handle different endpoints
    if (path.startsWith('/properties')) {
      // Handle properties endpoints
      airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Properties`
      
      if (actualMethod === 'GET') {
        const propertyId = path.split('/')[2]
        let queryString = ''

        if (actualEndpoint && actualEndpoint.includes('?')) {
          queryString = actualEndpoint.split('?')[1]
        } else {
          const urlObj = new URL(req.url)
          queryString = urlObj.searchParams.toString()
        }

        if (propertyId) {
          airtableUrl += `/${propertyId}`
        } else if (queryString) {
          airtableUrl += `?${queryString}`
        }
      }
    } else if (path.startsWith('/customer-actions')) {
      // Handle customer actions endpoints
      airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Customer%20Actions`
      
      if (actualMethod === 'GET') {
        // Forward any query string (filterByFormula, sort, pageSize, etc.) or fetch by ID
        const actionId = path.split('/')[2]
        let queryString = ''

        if (actualEndpoint && actualEndpoint.includes('?')) {
          queryString = actualEndpoint.split('?')[1]
        } else {
          const urlObj = new URL(req.url)
          queryString = urlObj.searchParams.toString()
        }

        const searchParams = new URLSearchParams(queryString)
        const customerIdParam = searchParams.get('customerId')
        const salespersonParam = searchParams.get('salesperson')

        if (salespersonParam) {
          console.log('[Airtable Proxy] Server-side filtering Customer Actions by salesperson:', salespersonParam)

          let allRecords: any[] = []
          let offset: string | undefined = undefined
          let page = 1

          // First, fetch all customers for this salesperson
          let customerUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Customers?pageSize=100`
          let customerRecords: any[] = []
          let customerOffset: string | undefined = undefined

          do {
            let pageUrl = customerOffset ? `${customerUrl}&offset=${customerOffset}` : customerUrl
            const resp = await fetch(pageUrl, { headers: airtableHeaders })
            const pageData = await resp.json()

            if (!resp.ok) {
              console.error('[Airtable Proxy] Airtable error while fetching customers:', pageData)
              return new Response(JSON.stringify({ error: 'Failed to fetch customers', details: pageData }), {
                status: resp.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            const pageRecords = Array.isArray(pageData.records) ? pageData.records : []
            customerRecords = customerRecords.concat(pageRecords)
            customerOffset = pageData.offset
          } while (customerOffset)

          // Filter customers by salesperson (case-insensitive, trim-safe)
          const normalizedParam = salespersonParam.trim().toLowerCase()
          const salespersonCustomers = customerRecords.filter((rec) => {
            const f = rec?.fields || {}
            return (f['Sales person'] || '').trim().toLowerCase() === normalizedParam
          })

          const customerIds = salespersonCustomers.map(rec => rec.id)
          console.log(`[Airtable Proxy] Found ${customerIds.length} customers for salesperson: ${salespersonParam}`)

          if (customerIds.length === 0) {
            return new Response(JSON.stringify({ records: [] }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // Now fetch all pending actions
          do {
            let pageUrl = `${airtableUrl}?pageSize=100&sort[0][field]=Action%20Date&sort[0][direction]=asc`
            if (offset) pageUrl += `&offset=${offset}`

            console.log(`[Airtable Proxy] Fetching Customer Actions page ${page}`)
            const resp = await fetch(pageUrl, { headers: airtableHeaders })
            const pageData = await resp.json()

            if (!resp.ok) {
              console.error('[Airtable Proxy] Airtable error while paging Customer Actions:', pageData)
              return new Response(JSON.stringify({ error: 'Failed to fetch customer actions', details: pageData }), {
                status: resp.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            const pageRecords = Array.isArray(pageData.records) ? pageData.records : []
            allRecords = allRecords.concat(pageRecords)
            offset = pageData.offset
            page += 1
          } while (offset)

          // Build a lookup map from customer ID to customer record
          const customerLookup = new Map<string, any>()
          salespersonCustomers.forEach(rec => customerLookup.set(rec.id, rec))

          // Filter by customer IDs and pending status
          const filtered = allRecords.filter((rec) => {
            const f = rec?.fields || {}
            const links = Array.isArray(f['Customer']) ? f['Customer'] : (Array.isArray(f['Customers']) ? f['Customers'] : [])
            const isForSalesperson = links.some((link: string) => customerIds.includes(link))
            const isPending = f['Completed'] !== 'Done'
            return isForSalesperson && isPending
          })

          // Enrich each action with customer name and salesperson
          filtered.forEach((rec) => {
            const f = rec?.fields || {}
            const links = Array.isArray(f['Customer']) ? f['Customer'] : (Array.isArray(f['Customers']) ? f['Customers'] : [])
            for (const link of links) {
              const cust = customerLookup.get(link)
              if (cust) {
                const cf = cust.fields || {}
                rec.fields['_customerName'] = `${cf['First name'] || ''} ${cf['Last name'] || ''}`.trim()
                rec.fields['_customerSalesperson'] = cf['Sales person'] || ''
                break
              }
            }
          })

          // Ensure consistent sorting by Action Date ASC (nulls last)
          filtered.sort((a: any, b: any) => {
            const da = a?.fields?.['Action Date'] ? Date.parse(a.fields['Action Date']) : Number.POSITIVE_INFINITY
            const db = b?.fields?.['Action Date'] ? Date.parse(b.fields['Action Date']) : Number.POSITIVE_INFINITY
            return da - db
          })

          console.log(`[Airtable Proxy] Returning ${filtered.length} filtered actions for salesperson: ${salespersonParam}`)
          return new Response(JSON.stringify({ records: filtered }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (customerIdParam) {
          console.log('[Airtable Proxy] Server-side filtering Customer Actions by customerId:', customerIdParam)

          let allRecords: any[] = []
          let offset: string | undefined = undefined
          let page = 1

          do {
            let pageUrl = `${airtableUrl}?pageSize=100&sort[0][field]=Action%20Date&sort[0][direction]=asc`
            if (offset) pageUrl += `&offset=${offset}`

            console.log(`[Airtable Proxy] Fetching Customer Actions page ${page} URL:`, pageUrl)
            const resp = await fetch(pageUrl, { headers: airtableHeaders })
            const pageData = await resp.json()

            if (!resp.ok) {
              console.error('[Airtable Proxy] Airtable error while paging Customer Actions:', pageData)
              return new Response(JSON.stringify({ error: 'Failed to fetch customer actions', details: pageData }), {
                status: resp.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            const pageRecords = Array.isArray(pageData.records) ? pageData.records : []
            allRecords = allRecords.concat(pageRecords)
            offset = pageData.offset
            page += 1
          } while (offset)

          const filtered = allRecords.filter((rec) => {
            const f = rec?.fields || {}
            const links = Array.isArray(f['Customer']) ? f['Customer'] : (Array.isArray(f['Customers']) ? f['Customers'] : [])
            return links.includes(customerIdParam)
          })

          // Ensure consistent sorting by Action Date ASC (nulls last)
          filtered.sort((a: any, b: any) => {
            const da = a?.fields?.['Action Date'] ? Date.parse(a.fields['Action Date']) : Number.POSITIVE_INFINITY
            const db = b?.fields?.['Action Date'] ? Date.parse(b.fields['Action Date']) : Number.POSITIVE_INFINITY
            return da - db
          })

          return new Response(JSON.stringify({ records: filtered }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (actionId) {
          airtableUrl += `/${actionId}`
        } else if (queryString) {
          airtableUrl += `?${queryString}`
        }
      } else if (actualMethod === 'POST') {
        // Create new customer action
        console.log('[Airtable Proxy] Creating customer action with data:', requestBody)
        const response = await fetch(airtableUrl, {
          method: 'POST',
          headers: airtableHeaders,
          body: JSON.stringify({
            fields: requestBody
          })
        })
        
        console.log('[Airtable Proxy] Airtable response status:', response.status)
        const data = await response.json()
        console.log('[Airtable Proxy] Airtable response data:', data)
        
        if (!response.ok) {
          console.error('[Airtable Proxy] Airtable API error:', data)
          console.error('[Airtable Proxy] Failed request data was:', requestBody)
          console.error('[Airtable Proxy] Response status:', response.status)
          return new Response(JSON.stringify({
            error: 'Failed to create customer action',
            details: data,
            requestData: requestBody,
            airtableError: true,
            status: response.status
          }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else if (actualMethod === 'PATCH') {
        // Update customer action (e.g., mark as completed or undo)
        const actionId = path.split('/')[2]
        airtableUrl += `/${actionId}`
        const response = await fetch(airtableUrl, {
          method: 'PATCH',
          headers: airtableHeaders,
          body: JSON.stringify({
            fields: requestBody
          })
        })
        const data = await response.json()
        if (!response.ok) {
          console.error('[Airtable Proxy] Failed to update customer action', data)
          return new Response(JSON.stringify({
            error: 'Failed to update customer action',
            details: data,
            requestData: requestBody,
            airtableError: true,
            status: response.status
          }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    } else if (path.startsWith('/customers')) {
      if (actualMethod === 'GET') {
        // Get all customers or a specific customer, forward query string (e.g., offset)
        const customerId = path.split('/')[2]
        let queryString = ''

        if (actualEndpoint && actualEndpoint.includes('?')) {
          queryString = actualEndpoint.split('?')[1]
        } else {
          const urlObj = new URL(req.url)
          queryString = urlObj.searchParams.toString()
        }

        if (customerId) {
          airtableUrl += `/${customerId}`
        } else if (queryString) {
          airtableUrl += `?${queryString}`
        }
      } else if (actualMethod === 'POST') {
        // Create new customer - use the unwrapped data
        console.log('[Airtable Proxy] Creating customer with data:', requestBody)
        const response = await fetch(airtableUrl, {
          method: 'POST',
          headers: airtableHeaders,
          body: JSON.stringify({
            fields: requestBody
          })
        })
        console.log('[Airtable Proxy] Airtable response status:', response.status)
        const data = await response.json()
        console.log('[Airtable Proxy] Airtable response data:', data)
        
        if (!response.ok) {
          console.error('[Airtable Proxy] Airtable API error:', data)
          console.error('[Airtable Proxy] Failed request data was:', requestBody)
          console.error('[Airtable Proxy] Response status:', response.status)
          return new Response(JSON.stringify({
            error: 'Failed to create customer',
            details: data,
            requestData: requestBody,
            airtableError: true,
            status: response.status
          }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else if (actualMethod === 'PATCH') {
        // Update existing customer - use the unwrapped data
        const customerId = path.split('/')[2]
        airtableUrl += `/${customerId}`
        const response = await fetch(airtableUrl, {
          method: 'PATCH',
          headers: airtableHeaders,
          body: JSON.stringify({
            fields: requestBody
          })
        })
        const data = await response.json()
        if (!response.ok) {
          console.error('[Airtable Proxy] Failed to update customer', data)
          return new Response(JSON.stringify({
            error: 'Failed to update customer',
            details: data,
            requestData: requestBody,
            airtableError: true,
            status: response.status
          }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    
    // Forward the request to Airtable
    console.log('[Airtable Proxy] Forwarding request to:', airtableUrl)
    const response = await fetch(airtableUrl, {
      method: actualMethod,
      headers: airtableHeaders
    })

    console.log('[Airtable Proxy] Response status:', response.status)
    const data = await response.json()
    console.log('[Airtable Proxy] Response data:', data)
    
    if (!response.ok) {
      console.error('[Airtable Proxy] Airtable API error:', data)
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Airtable Proxy] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})