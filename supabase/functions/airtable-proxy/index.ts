import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    'Areas of interest': string
    'Must have': string
    'Nice to have': string
    'Neighborhood or address': string
    'Salesperson': string
    'Source of contact': string
    'Last Contact': string
    'Property Type': string[]
    'Bedrooms': number
    'Bathrooms': number
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
    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.replace('/airtable-proxy', '')

    console.log(`[Airtable Proxy] ${method} request to path: ${path}`)

    // Get Airtable credentials from Supabase secrets
    const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')
    const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')

    console.log('[Airtable Proxy] Credentials check:', {
      hasApiKey: !!AIRTABLE_API_KEY,
      hasBaseId: !!AIRTABLE_BASE_ID,
      apiKeyLength: AIRTABLE_API_KEY?.length || 0,
      baseIdLength: AIRTABLE_BASE_ID?.length || 0
    })

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('[Airtable Proxy] Missing credentials')
      return new Response(
        JSON.stringify({ error: 'Airtable credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const airtableHeaders = {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }

    let airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Customers`
    
    // Handle different endpoints
    if (path.startsWith('/customers')) {
      if (method === 'GET') {
        // Get all customers or a specific customer
        const customerId = path.split('/')[2]
        if (customerId) {
          airtableUrl += `/${customerId}`
        }
      } else if (method === 'POST') {
        // Create new customer
        const body = await req.json()
        console.log('[Airtable Proxy] Creating customer with data:', body)
        const response = await fetch(airtableUrl, {
          method: 'POST',
          headers: airtableHeaders,
          body: JSON.stringify({
            fields: body
          })
        })
        
        console.log('[Airtable Proxy] Airtable response status:', response.status)
        const data = await response.json()
        console.log('[Airtable Proxy] Airtable response data:', data)
        
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
      } else if (method === 'PATCH') {
        // Update existing customer
        const customerId = path.split('/')[2]
        const body = await req.json()
        airtableUrl += `/${customerId}`
        const response = await fetch(airtableUrl, {
          method: 'PATCH',
          headers: airtableHeaders,
          body: JSON.stringify({
            fields: body
          })
        })
        const data = await response.json()
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Forward the request to Airtable
    console.log('[Airtable Proxy] Forwarding request to:', airtableUrl)
    const response = await fetch(airtableUrl, {
      method,
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
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})