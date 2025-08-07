import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AirtableRecord {
  id: string
  fields: {
    'Full Name': string
    'Phone': string
    'Email': string
    'Phase': string
    'Location': string
    'Budget Range': string
    'Salesperson': string
    'Last Contact': string
    'Property Type': string[]
    'Bedrooms': number
    'Bathrooms': number
    'Notes': string
    'Next Action Date': string
    'Next Action Type': string
    'Tags': string[]
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

    // Get Airtable credentials from Supabase secrets
    const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')
    const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
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
        const response = await fetch(airtableUrl, {
          method: 'POST',
          headers: airtableHeaders,
          body: JSON.stringify({
            fields: body
          })
        })
        const data = await response.json()
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
    const response = await fetch(airtableUrl, {
      method,
      headers: airtableHeaders
    })

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})