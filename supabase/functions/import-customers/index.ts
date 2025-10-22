import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY')
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')
const AIRTABLE_TABLE_NAME = 'Customers'

const OWNER_TO_USER_MAP: Record<string, { email: string; fullName: string }> = {
  'Aino': { email: 'sales@lainehomes.es', fullName: 'Sales Team' },
  'Janne Mikkola': { email: 'janne@lainehomes.es', fullName: 'Janne Laine' },
  'Juha': { email: 'sales@lainehomes.es', fullName: 'Sales Team' },
  'Kari Hakuli': { email: 'sales@lainehomes.es', fullName: 'Sales Team' },
  'Karoliina Korpela': { email: 'sales@lainehomes.es', fullName: 'Sales Team' },
  'Minna Laine': { email: 'minna@lainehomes.es', fullName: 'Minna Laine' },
  'Monica Teräste': { email: 'monica@lainehomes.es', fullName: 'Monica Teräste' },
  'Päivi Siggberg': { email: 'sales@lainehomes.es', fullName: 'Sales Team' },
  'Pasi Laine': { email: 'pasi@lainehomes.es', fullName: 'Pasi Laine' },
  'Sakari Nurmela': { email: 'sakari@lainehomes.es', fullName: 'Sakari Nurmela' },
  'Suvi Yli-Piipari': { email: 'sales@lainehomes.es', fullName: 'Sales Team' }
}

interface ImportRecord {
  'Person - First name': string
  'Person - Last name': string
  'Person - Email - Work': string
  'Person - Email - Home': string
  'Person - Email - Other': string
  'Person - Phone - Mobile': string
  'Person - Phone - Work': string
  'Person - Phone - Home': string
  'Person - Phone - Other': string
  'Person - Owner': string
  'Person - Source of contact': string
  'Person - Rooms': string
  'Person - Property Type': string
  'Person - When to Buy?': string
  'Person - Where to Buy?': string
  'Person - Resale Or New Development?': string
  'Person - Marketing permission': string
  'Person - Muistiinpanot': string
  'Person - Next activity date': string
  'Person - Person created': string
}

function normalizeTimeOfPurchase(value: string): string {
  if (!value) return ''
  const lower = value.toLowerCase().trim()
  if (lower.includes('immediately') || lower.includes('heti')) return 'Immediately'
  if (lower.includes('6-12') || lower.includes('6 - 12')) return '6-12 months'
  if (lower.includes('0-6') || lower.includes('0 - 6')) return '0-6 months'
  if (lower.includes('12+') || lower.includes('over 12')) return '12+ months'
  return value
}

function normalizeSourceOfContact(value: string): string {
  if (!value) return ''
  
  const normalized = value.trim()
  
  // Map common variations to exact Airtable option names
  if (normalized.includes('Contact form') && normalized.includes('property link')) {
    return 'Contact form, property link from web page'
  }
  if (normalized.toLowerCase().includes('property listing')) {
    return 'Property listing'
  }
  if (normalized.toLowerCase().includes('idealista')) {
    return 'Idealista'
  }
  if (normalized.toLowerCase().includes('etuovi')) {
    return 'Etuovi'
  }
  
  return normalized
}

function parseCondition(value: string): string[] {
  if (!value) return []
  const conditions: string[] = []
  const lower = value.toLowerCase()
  if (lower.includes('resale')) conditions.push('Resale buyer')
  if (lower.includes('new development')) conditions.push('New-build customer')
  return conditions
}

function getEmail(record: ImportRecord): string {
  return record['Person - Email - Work'] || 
         record['Person - Email - Home'] || 
         record['Person - Email - Other'] || 
         ''
}

function getPhone(record: ImportRecord): string {
  return record['Person - Phone - Mobile'] || 
         record['Person - Phone - Work'] || 
         record['Person - Phone - Home'] || 
         record['Person - Phone - Other'] || 
         ''
}

function getSalesperson(owner: string): string {
  if (!owner) return 'Sales Team'
  const mapping = OWNER_TO_USER_MAP[owner]
  if (mapping) {
    return mapping.fullName
  }
  console.warn(`Unmapped owner: ${owner}, defaulting to Sales Team`)
  return 'Sales Team'
}

async function checkDuplicate(email: string): Promise<boolean> {
  if (!email) return false
  
  const formula = `{Email} = '${email.replace(/'/g, "\\'")}'`
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.records && data.records.length > 0
}

async function createBatch(records: any[]): Promise<{ created: any[], errors: any[] }> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records }),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    if (response.status === 429) {
      // Rate limit hit, wait and retry
      const retryAfter = parseInt(response.headers.get('retry-after') || '30')
      console.log(`Rate limited, waiting ${retryAfter}s before retry`)
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      return createBatch(records)
    }
    throw new Error(`Airtable API error: ${data.error?.message || response.statusText}`)
  }
  
  return { created: data.records || [], errors: [] }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { records, skipDuplicates = true } = await req.json()

    if (!records || !Array.isArray(records)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: records array required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Starting import of ${records.length} records`)

    const results = {
      total: records.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      skippedRecords: [] as any[],
      failedRecords: [] as any[],
      salespersonStats: {} as Record<string, number>,
    }

    const batchSize = 10 // Airtable batch create limit
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const airtableRecords = []
      
      for (const [idx, record] of batch.entries()) {
        const rowNumber = i + idx + 1
        
        try {
          // Validate required fields
          if (!record['Person - First name'] || !record['Person - Last name']) {
            results.failed++
            results.failedRecords.push({
              row: rowNumber,
              error: 'Missing required field: First name or Last name',
              data: record
            })
            continue
          }

          const email = getEmail(record)
          const phone = getPhone(record)
          
          if (!email && !phone) {
            results.failed++
            results.failedRecords.push({
              row: rowNumber,
              error: 'Missing both email and phone',
              data: record
            })
            continue
          }

          // Check for duplicates
          if (skipDuplicates && email) {
            const isDuplicate = await checkDuplicate(email)
            if (isDuplicate) {
              results.skipped++
              results.skippedRecords.push({
                row: rowNumber,
                email,
                reason: 'Duplicate email'
              })
              continue
            }
          }

          const salesperson = getSalesperson(record['Person - Owner'])
          
          // Build notes field
          let notes = record['Person - Muistiinpanot'] || ''
          if (record['Person - Person created']) {
            notes = `Created in Pipedrive: ${record['Person - Person created']}\n\n${notes}`
          }

          // Transform record to Airtable format
          const airtableRecord = {
            fields: {
              'First name': record['Person - First name'],
              'Last name': record['Person - Last name'],
              'Email': email || undefined,
              'Phone number': phone || undefined,
              'Sales person': salesperson,
              'Source of contact': record['Person - Source of contact'] ? [normalizeSourceOfContact(record['Person - Source of contact'])] : undefined,
              'Bedrooms': record['Person - Rooms'] ? [record['Person - Rooms']] : undefined,
              'Type of apartment': record['Person - Property Type'] ? [record['Person - Property Type']] : undefined,
              'Time of purchase': normalizeTimeOfPurchase(record['Person - When to Buy?']) || undefined,
              'Areas of interest': record['Person - Where to Buy?'] ? [record['Person - Where to Buy?']] : undefined,
              'Customer category': parseCondition(record['Person - Resale Or New Development?']),
              'Marketing permission': record['Person - Marketing permission'] === 'Kyllä',
              'Notes': notes || undefined,
              'Next Action Date': record['Person - Next activity date'] || undefined,
            }
          }

          // Remove undefined fields
          Object.keys(airtableRecord.fields).forEach(key => {
            if (airtableRecord.fields[key] === undefined) {
              delete airtableRecord.fields[key]
            }
          })

          airtableRecords.push(airtableRecord)
          
          // Update stats
          results.salespersonStats[salesperson] = (results.salespersonStats[salesperson] || 0) + 1
          
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          results.failed++
          results.failedRecords.push({
            row: rowNumber,
            error: error.message,
            data: record
          })
        }
      }

      // Create batch in Airtable
      if (airtableRecords.length > 0) {
        try {
          const { created } = await createBatch(airtableRecords)
          results.imported += created.length
          console.log(`Batch ${Math.floor(i / batchSize) + 1}: Created ${created.length} records`)
          
          // Rate limiting: 5 requests per second
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`Error creating batch:`, error)
          results.failed += airtableRecords.length
          for (let j = 0; j < airtableRecords.length; j++) {
            results.failedRecords.push({
              row: i + j + 1,
              error: error.message,
              data: batch[j]
            })
          }
        }
      }
    }

    console.log(`Import complete: ${results.imported} imported, ${results.skipped} skipped, ${results.failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.total,
          imported: results.imported,
          skipped: results.skipped,
          failed: results.failed,
        },
        skippedRecords: results.skippedRecords,
        failedRecords: results.failedRecords,
        salespersonStats: results.salespersonStats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
