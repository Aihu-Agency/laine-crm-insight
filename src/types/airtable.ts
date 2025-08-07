export interface AirtableCustomer {
  id: string
  fields: {
    'Full Name': string
    'Phone'?: string
    'Email'?: string
    'Phase': string
    'Location'?: string
    'Budget Range'?: string
    'Salesperson'?: string
    'Last Contact'?: string
    'Property Type'?: string[]
    'Bedrooms'?: number
    'Bathrooms'?: number
    'Notes'?: string
    'Next Action Date'?: string
    'Next Action Type'?: string
    'Tags'?: string[]
  }
  createdTime: string
}

export interface AirtableResponse {
  records: AirtableCustomer[]
  offset?: string
}

export interface Customer {
  id: string
  fullName: string
  phone?: string
  email?: string
  phase: string
  location?: string
  budgetRange?: string
  salesperson?: string
  lastContact?: string
  propertyType?: string[]
  bedrooms?: number
  bathrooms?: number
  notes?: string
  nextActionDate?: string
  nextActionType?: string
  tags?: string[]
  createdTime: string
}

// Transform Airtable record to our Customer interface
export const transformAirtableCustomer = (record: AirtableCustomer): Customer => ({
  id: record.id,
  fullName: record.fields['Full Name'] || '',
  phone: record.fields['Phone'],
  email: record.fields['Email'],
  phase: record.fields['Phase'] || 'New Lead',
  location: record.fields['Location'],
  budgetRange: record.fields['Budget Range'],
  salesperson: record.fields['Salesperson'],
  lastContact: record.fields['Last Contact'],
  propertyType: record.fields['Property Type'],
  bedrooms: record.fields['Bedrooms'],
  bathrooms: record.fields['Bathrooms'],
  notes: record.fields['Notes'],
  nextActionDate: record.fields['Next Action Date'],
  nextActionType: record.fields['Next Action Type'],
  tags: record.fields['Tags'],
  createdTime: record.createdTime
})