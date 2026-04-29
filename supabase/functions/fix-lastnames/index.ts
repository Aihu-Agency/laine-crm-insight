import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')
const TABLE = 'Customers'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Admin auth
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: claimsData } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''))
    if (!claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: claimsData.claims.sub, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Body: { pipedriveIndex: { [email]: { firstName, lastName } }, dryRun?: boolean }
    const { pipedriveIndex, dryRun = false } = await req.json()
    if (!pipedriveIndex || typeof pipedriveIndex !== 'object') {
      return new Response(JSON.stringify({ error: 'pipedriveIndex required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch all Airtable rows missing lastname but with email
    const formula = `AND({Email} != '', OR({Last name} = '', {Last name} = BLANK()))`
    const candidates: any[] = []
    let offset: string | undefined
    do {
      const params = new URLSearchParams({ filterByFormula: formula, pageSize: '100' })
      params.append('fields[]', 'Email')
      params.append('fields[]', 'First name')
      params.append('fields[]', 'Last name')
      if (offset) params.set('offset', offset)
      const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE}?${params}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      })
      if (!res.ok) throw new Error(`Airtable fetch ${res.status}: ${await res.text()}`)
      const data = await res.json()
      candidates.push(...data.records)
      offset = data.offset
      await new Promise(r => setTimeout(r, 220))
    } while (offset)

    const toUpdate: any[] = []
    const noMatch: any[] = []
    for (const rec of candidates) {
      const email = (rec.fields['Email'] || '').trim().toLowerCase()
      if (!email) continue
      const hit = pipedriveIndex[email]
      if (!hit || !hit.lastName) {
        noMatch.push({ id: rec.id, email, currentFirst: rec.fields['First name'] || '' })
        continue
      }
      toUpdate.push({
        id: rec.id,
        fields: {
          'First name': hit.firstName || rec.fields['First name'] || '',
          'Last name': hit.lastName,
        },
      })
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        candidates: candidates.length,
        wouldUpdate: toUpdate.length,
        noMatch: noMatch.length,
        sample: toUpdate.slice(0, 5),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let updated = 0
    const failed: any[] = []
    for (let i = 0; i < toUpdate.length; i += 10) {
      const batch = toUpdate.slice(i, i + 10)
      const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: batch }),
      })
      if (!res.ok) {
        const txt = await res.text()
        failed.push({ batch: i, error: txt })
      } else {
        const data = await res.json()
        updated += data.records.length
      }
      await new Promise(r => setTimeout(r, 220))
    }

    return new Response(JSON.stringify({
      candidates: candidates.length,
      updated,
      noMatchCount: noMatch.length,
      failed,
      noMatch: noMatch.slice(0, 1000),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
