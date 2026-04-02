import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')
const AIRTABLE_TABLE_NAME = 'Customers'

// Map Sales_Rep values to CRM salesperson names
const SALES_REP_MAP: Record<string, string> = {
  'minna laine': 'Minna Laine',
  'pasi laine': 'Pasi Laine',
  'monica teräste': 'Monica Teräste',
  'monica teraste': 'Monica Teräste',
  'janne laine': 'Janne Laine',
  'sakari nurmela': 'Sakari Nurmela',
  'karoliina korpela': 'Sales Team',
  'petri hinno': 'Sales Team',
  'juha': 'Sales Team',
}

function getSalesperson(salesRep: string): string {
  if (!salesRep) return 'Sales Team'
  // Strip "Other: " prefix
  const cleaned = salesRep.replace(/^Other:\s*/i, '').trim()
  if (!cleaned || cleaned.toLowerCase() === 'no match') return 'Sales Team'
  const key = cleaned.toLowerCase()
  return SALES_REP_MAP[key] || 'Sales Team'
}

function splitName(name: string): { firstName: string; lastName: string } {
  if (!name || !name.trim()) return { firstName: 'Unknown', lastName: '' }
  const trimmed = name.trim()
  // If it looks like an email, use part before @
  if (trimmed.includes('@')) {
    const local = trimmed.split('@')[0]
    return { firstName: local, lastName: '' }
  }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function parseAreas(raw: string): string[] {
  if (!raw || !raw.trim()) return []
  // Format: "Espanja, Costa del Sol\, Espanja, Costa Blanca\, Espanja"
  // Backslash-comma means the comma is part of the value
  // First, split on commas NOT preceded by backslash
  const parts = raw.split(/(?<!\\),\s*/).map(p => p.replace(/\\/g, '').trim()).filter(Boolean)
  
  const areas: string[] = []
  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower.includes('costa del sol')) {
      areas.push('Costa del Sol')
    } else if (lower.includes('costa blanca')) {
      areas.push('Costa Blanca')
    } else if (lower === 'espanja' || lower === 'spain') {
      if (areas.length === 0) areas.push('Costa del Sol')
    }
  }
  return [...new Set(areas)]
}

function parseCondition(value: string): string[] {
  if (!value) return []
  const lower = value.toLowerCase().trim()
  if (lower.includes('both')) return ['Resale buyer', 'New-build customer']
  if (lower.includes('resale') || lower.includes('jälleenmyynti')) return ['Resale buyer']
  if (lower.includes('new') || lower.includes('uudiskohde')) return ['New-build customer']
  return []
}

function parseTimeOfPurchase(val1: string, val2: string): string {
  const value = (val1 || val2 || '').trim()
  if (!value) return ''
  const lower = value.toLowerCase()
  if (lower.includes('heti') || lower.includes('immediately')) return 'Immediately'
  if (lower.includes('0-6') || lower.includes('0 - 6')) return '0-6 months'
  if (lower.includes('6-12') || lower.includes('6 - 12')) return '6-12 months'
  if (lower.includes('12+') || lower.includes('yli 12') || lower.includes('over 12')) return '12+ months'
  return ''
}

async function checkDuplicate(email: string): Promise<boolean> {
  if (!email) return false
  const formula = `{Email} = '${email.replace(/'/g, "\\'")}'`
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`Airtable API error: ${response.statusText}`)
  const data = await response.json()
  return data.records && data.records.length > 0
}

async function createBatch(records: any[]): Promise<{ created: any[], errors: any[] }> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  })
  const data = await response.json()
  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '30')
      console.log(`Rate limited, waiting ${retryAfter}s`)
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      return createBatch(records)
    }
    throw new Error(`Airtable API error: ${data.error?.message || response.statusText}`)
  }
  return { created: data.records || [], errors: [] }
}

// Sanitize fields: remove undefined, null, empty strings, empty arrays
function sanitizeFields(fields: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      const filtered = value.filter(v => v !== undefined && v !== null && v !== '')
      if (filtered.length > 0) clean[key] = filtered
    } else {
      clean[key] = value
    }
  }
  return clean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Admin authorization check
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''))
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = claimsData.claims.sub

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { records, skipDuplicates = true, onlyNewLeads = true } = await req.json()

    if (!records || !Array.isArray(records)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: records array required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Starting Mailchimp import of ${records.length} records (onlyNewLeads=${onlyNewLeads})`)

    const results = {
      total: records.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      filteredOut: 0,
      skippedRecords: [] as any[],
      failedRecords: [] as any[],
      salespersonStats: {} as Record<string, number>,
      importedRecords: [] as Array<{ email: string; name: string; salesperson: string }>,
    }

    const batchSize = 10

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const airtableRecords = []

      for (const [idx, record] of batch.entries()) {
        const rowNumber = i + idx + 1

        try {
          // Filter: only import no_match records if onlyNewLeads is true
          if (onlyNewLeads) {
            const matchMethod = (record['Match_Method'] || '').trim()
            if (matchMethod && matchMethod !== 'no_match') {
              results.filteredOut++
              continue
            }
          }

          const email = (record['Sähköpostiosoite'] || '').trim()
          const { firstName, lastName } = splitName(record['Nimi'] || '')

          if (!firstName || firstName === 'Unknown') {
            // Try using email local part
            if (!email) {
              results.failed++
              results.failedRecords.push({ row: rowNumber, error: 'Missing name and email', data: record })
              continue
            }
          }

          // Duplicate check against Airtable
          if (skipDuplicates && email) {
            const isDuplicate = await checkDuplicate(email)
            if (isDuplicate) {
              results.skipped++
              results.skippedRecords.push({ row: rowNumber, email, reason: 'Duplicate email in Airtable' })
              continue
            }
          }

          const salesperson = getSalesperson(record['Sales_Rep'] || '')
          const areas = parseAreas(record['Maat jotka kiinnostavat:'] || '')
          const condition = parseCondition(record['Resale Or New Development?'] || '')
          const timeOfPurchase = parseTimeOfPurchase(
            record['Mahdollinen ostoaikataulu?'] || '',
            record['Ostoajankohta'] || ''
          )

          // Build notes
          const noteParts: string[] = []
          if (record['OPTIN_TIME']) noteParts.push(`Mailchimp subscriber since: ${record['OPTIN_TIME']}`)
          if (record['TAGS']) noteParts.push(`Tags: ${record['TAGS']}`)
          if (record['NOTES']) noteParts.push(record['NOTES'])
          if (record['Costa del Sol vai Costa Blanca?']) noteParts.push(`Preferred coast: ${record['Costa del Sol vai Costa Blanca?']}`)

          const fields = sanitizeFields({
            'First name': firstName,
            'Last name': lastName || undefined,
            'Email': email || undefined,
            'Phone number': (record['Phone Number'] || '').trim() || undefined,
            'Sales person': salesperson,
            'Areas of interest': areas.length > 0 ? areas : undefined,
            'Customer category': condition.length > 0 ? condition : undefined,
            'Time of purchase': timeOfPurchase || undefined,
            'Marketing permission': true,
            'Notes': noteParts.length > 0 ? noteParts.join('\n') : undefined,
          })

          airtableRecords.push({ fields })
          results.salespersonStats[salesperson] = (results.salespersonStats[salesperson] || 0) + 1
          results.importedRecords.push({ email, name: `${firstName} ${lastName}`.trim(), salesperson })

        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          results.failed++
          results.failedRecords.push({ row: rowNumber, error: error.message, data: record })
        }
      }

      if (airtableRecords.length > 0) {
        try {
          const { created } = await createBatch(airtableRecords)
          results.imported += created.length
          console.log(`Batch ${Math.floor(i / batchSize) + 1}: Created ${created.length} records`)
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`Error creating batch:`, error)
          results.failed += airtableRecords.length
          // Remove from importedRecords since they failed
          results.importedRecords.splice(-airtableRecords.length)
          for (let j = 0; j < airtableRecords.length; j++) {
            results.failedRecords.push({ row: i + j + 1, error: error.message, data: batch[j] })
          }
        }
      }
    }

    console.log(`Mailchimp import complete: ${results.imported} imported, ${results.skipped} skipped, ${results.filteredOut} filtered, ${results.failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.total,
          imported: results.imported,
          skipped: results.skipped,
          failed: results.failed,
          filteredOut: results.filteredOut,
        },
        skippedRecords: results.skippedRecords,
        failedRecords: results.failedRecords,
        salespersonStats: results.salespersonStats,
        importedRecords: results.importedRecords,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
