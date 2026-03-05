import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AirtableCustomer {
  id: string
  fields: {
    'Phone number'?: string
    [key: string]: any
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // --- Admin authorization check ---
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''))
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = claimsData.claims.sub

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log('Starting phone number cleanup...')

    // Initialize Supabase client with service role for internal calls
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Fetch all customers from Airtable via proxy
    console.log('Fetching customers from Airtable...')
    let allCustomers: AirtableCustomer[] = []
    let offset: string | undefined = undefined

    do {
      const basePath = '/customers?pageSize=100'
      const endpoint = offset ? `${basePath}&offset=${encodeURIComponent(offset)}` : basePath
      const { data: responseData, error } = await supabase.functions.invoke('airtable-proxy', {
        body: { endpoint, method: 'GET' }
      })

      if (error) {
        console.error('Error fetching customers:', error)
        throw new Error(`Failed to fetch customers: ${error.message}`)
      }

      // The airtable-proxy returns the Airtable API response directly, but be robust to different shapes
      let parsed: any = responseData
      try {
        if (typeof parsed === 'string') parsed = JSON.parse(parsed)
      } catch (_) {
        // keep as-is
      }

      if (parsed && Array.isArray(parsed.records)) {
        const records = parsed.records as AirtableCustomer[]
        allCustomers = allCustomers.concat(records)
        offset = parsed.offset
        console.log(`Fetched ${records.length} customers, total: ${allCustomers.length}`)
      } else if (parsed && parsed.id && parsed.fields) {
        // Single-record response (unexpected for list endpoint) - handle gracefully
        allCustomers.push(parsed as AirtableCustomer)
        offset = undefined
        console.log('Fetched single record response; stopping pagination')
      } else {
        console.error('Invalid response structure from airtable-proxy:', parsed)
        // Break to avoid infinite loop; proceed with what we have
        break
      }
    } while (offset)

    console.log(`Total customers fetched: ${allCustomers.length}`)

    // Find customers with phone numbers that need fixing
    const customersToFix: Array<{ id: string; oldPhone: string; newPhone: string }> = []

    for (const customer of allCustomers) {
      const phoneNumber = customer.fields['Phone number']
      
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        continue
      }

      const trimmedPhone = phoneNumber.trim()
      
      // Normalize phone number: keep + at start if present, remove all other non-digits
      let normalized = trimmedPhone
      if (trimmedPhone.startsWith('+')) {
        // Keep the + and remove all non-digits after it
        normalized = '+' + trimmedPhone.slice(1).replace(/\D/g, '')
      } else {
        // Remove all non-digit characters
        normalized = trimmedPhone.replace(/\D/g, '')
      }
      
      // Skip if nothing changed or if number is empty after normalization
      if (!normalized || normalized === trimmedPhone) {
        continue
      }
      
      // Check if normalized phone needs a leading 0 (starts with digits 1-9, not 0, not +)
      let finalPhone = normalized
      if (/^[1-9]/.test(normalized)) {
        finalPhone = `0${normalized}`
      }
      
      // Only add to fix list if the final phone differs from original
      if (finalPhone !== trimmedPhone) {
        customersToFix.push({
          id: customer.id,
          oldPhone: trimmedPhone,
          newPhone: finalPhone
        })
      }
    }

    console.log(`Found ${customersToFix.length} customers with phone numbers to fix`)

    // Update each customer
    let successCount = 0
    let errorCount = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const customer of customersToFix) {
      try {
        console.log(`Updating customer ${customer.id}: ${customer.oldPhone} -> ${customer.newPhone}`)
        
        const { data, error } = await supabase.functions.invoke('airtable-proxy', {
          body: {
            endpoint: `/customers/${customer.id}`,
            method: 'PATCH',
            data: { 'Phone number': customer.newPhone }
          }
        })

        if (error) {
          console.error(`Error updating customer ${customer.id}:`, error)
          errorCount++
          errors.push({ id: customer.id, error: error.message })
        } else {
          successCount++
          console.log(`Successfully updated customer ${customer.id}`)
        }
      } catch (err) {
        console.error(`Exception updating customer ${customer.id}:`, err)
        errorCount++
        errors.push({ id: customer.id, error: String(err) })
      }
    }

    const result = {
      totalCustomers: allCustomers.length,
      customersNeedingFix: customersToFix.length,
      successfulUpdates: successCount,
      failedUpdates: errorCount,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('Phone number cleanup completed:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in fix-phone-numbers function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
