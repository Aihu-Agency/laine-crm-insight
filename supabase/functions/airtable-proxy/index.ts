// Airtable API Proxy Edge Function - Force deployment
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

    console.log('[Airtable Proxy] Environment check:', {
      hasApiKey: !!AIRTABLE_API_KEY,
      hasBaseId: !!AIRTABLE_BASE_ID,
      apiKeyLength: AIRTABLE_API_KEY?.length || 0,
      baseIdLength: AIRTABLE_BASE_ID?.length || 0,
      apiKeyStart: AIRTABLE_API_KEY ? AIRTABLE_API_KEY.substring(0, 8) : 'missing',
      baseIdStart: AIRTABLE_BASE_ID ? AIRTABLE_BASE_ID.substring(0, 8) : 'missing'
    })

    console.log('[Airtable Proxy] Environment variables available:', Object.keys(Deno.env.toObject()))
    console.log('[Airtable Proxy] Credentials check:', {
      hasApiKey: !!AIRTABLE_API_KEY,
      hasBaseId: !!AIRTABLE_BASE_ID,
      apiKeyLength: AIRTABLE_API_KEY?.length || 0,
      baseIdLength: AIRTABLE_BASE_ID?.length || 0,
      apiKeyPrefix: AIRTABLE_API_KEY ? AIRTABLE_API_KEY.substring(0, 8) + '...' : 'none',
      baseIdPrefix: AIRTABLE_BASE_ID ? AIRTABLE_BASE_ID.substring(0, 8) + '...' : 'none'
    })

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('[Airtable Proxy] Missing credentials - API Key exists:', !!AIRTABLE_API_KEY, 'Base ID exists:', !!AIRTABLE_BASE_ID)
      return new Response(
        JSON.stringify({ 
          error: 'Airtable credentials not configured',
          details: {
            hasApiKey: !!AIRTABLE_API_KEY,
            hasBaseId: !!AIRTABLE_BASE_ID,
            availableEnvVars: Object.keys(Deno.env.toObject())
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Test Airtable API connectivity first
    console.log('[Airtable Proxy] Testing Airtable API connectivity...')
    const testUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Customers?maxRecords=1`
    const testHeaders = {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
    
    console.log('[Airtable Proxy] Test URL:', testUrl)
    console.log('[Airtable Proxy] Test headers (without auth):', { 'Content-Type': 'application/json' })
    
    try {
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: testHeaders
      })
      console.log('[Airtable Proxy] Test response status:', testResponse.status)
      
      if (!testResponse.ok) {
        const testError = await testResponse.text()
        console.error('[Airtable Proxy] Airtable API test failed:', testError)
        return new Response(
          JSON.stringify({ 
            error: 'Airtable API authentication failed',
            details: {
              status: testResponse.status,
              statusText: testResponse.statusText,
              response: testError
            }
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const testData = await testResponse.json()
      console.log('[Airtable Proxy] Airtable API test successful, record count:', testData.records?.length || 0)
    } catch (testError) {
      console.error('[Airtable Proxy] Airtable API test error:', testError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to connect to Airtable API',
          details: {
            message: testError.message,
            name: testError.name
          }
        }),
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
      if (actualMethod === 'GET') {
        // Get all customers or a specific customer
        const customerId = path.split('/')[2]
        if (customerId) {
          airtableUrl += `/${customerId}`
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
          return new Response(JSON.stringify(data), {
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
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})