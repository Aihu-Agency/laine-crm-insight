export interface AirtableCustomer {
  id: string
  fields: {
    'First name': string
    'Last name': string
    'Phone number'?: string
    'Email'?: string
    'Language'?: string
    'Customer type'?: string
    'Customer category'?: string
    'Time of purchase'?: string
    'Min price'?: number
    'Max price'?: number
    'Areas of interest'?: string[]
    'Must have'?: string
    'Nice to have'?: string
    'Neighborhood or address'?: string
    'Sales person'?: string
    'Source of contact'?: string
    'Type of apartment'?: string[]
    'Bedrooms'?: string[]
    'Bathrooms'?: string[]
    'Notes'?: string
    'Next Action Date'?: string
    'Next Action Type'?: string
    'Next Action Note'?: string
    'Customer number'?: number
  }
  createdTime: string
}

export interface AirtableResponse {
  records: AirtableCustomer[]
  offset?: string
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  phase?: string
  language?: string
  customerType?: string
  customerCategory?: string
  timeOfPurchase?: string
  minPrice?: number
  maxPrice?: number
  areasOfInterest?: string
  mustHave?: string
  niceToHave?: string
  neighborhoodOrAddress?: string
  salesperson?: string
  sourceOfContact?: string
  lastContact?: string
  propertyType?: string[]
  bedrooms?: number
  bathrooms?: number
  notes?: string
  nextActionDate?: string
  nextActionType?: string
  nextActionNote?: string
  tags?: string[]
  customerNumber?: number
  createdTime: string
}

// Transform Airtable record to our Customer interface
// Customer Action interfaces
export interface AirtableCustomerAction {
  id: string
  fields: {
    'Customer Action'?: number
    'Customer number'?: string[]
    'Action Description'?: string
    'Completed'?: 'Done' | undefined
    'Action Date'?: string
  }
  createdTime: string
}

export interface AirtableCustomerActionResponse {
  records: AirtableCustomerAction[]
  offset?: string
}

export interface CustomerAction {
  id: string
  customerActionNumber?: number
  customerNumber?: string[]
  actionDescription: string
  completed: boolean
  actionDate: string
  createdTime: string
}

// Transform Airtable customer action record to our CustomerAction interface
export const transformAirtableCustomerAction = (record: AirtableCustomerAction): CustomerAction => ({
  id: record.id,
  customerActionNumber: record.fields['Customer Action'],
  customerNumber: record.fields['Customer number'],
  actionDescription: record.fields['Action Description'] || '',
  completed: record.fields['Completed'] === 'Done',
  actionDate: record.fields['Action Date'] || '',
  createdTime: record.createdTime
})

export const transformAirtableCustomer = (record: AirtableCustomer): Customer => ({
  id: record.id,
  firstName: record.fields['First name'] || '',
  lastName: record.fields['Last name'] || '',
  phone: record.fields['Phone number'],
  email: record.fields['Email'],
  phase: 'New Lead', // Default value since this field doesn't exist in Airtable
  language: record.fields['Language'],
  customerType: record.fields['Customer type'],
  customerCategory: record.fields['Customer category'],
  timeOfPurchase: record.fields['Time of purchase'],
  minPrice: record.fields['Min price'],
  maxPrice: record.fields['Max price'],
  areasOfInterest: record.fields['Areas of interest']?.join(', '),
  mustHave: record.fields['Must have'],
  niceToHave: record.fields['Nice to have'],
  neighborhoodOrAddress: record.fields['Neighborhood or address'],
  salesperson: record.fields['Sales person'],
  sourceOfContact: record.fields['Source of contact'],
  lastContact: undefined, // Field doesn't exist in Airtable
  propertyType: record.fields['Type of apartment'],
  bedrooms: record.fields['Bedrooms']?.[0] ? parseInt(record.fields['Bedrooms'][0]) : undefined,
  bathrooms: record.fields['Bathrooms']?.[0] ? parseInt(record.fields['Bathrooms'][0]) : undefined,
  notes: record.fields['Notes'],
  nextActionDate: record.fields['Next Action Date'],
  nextActionType: record.fields['Next Action Type'],
  nextActionNote: record.fields['Next Action Note'],
  tags: [], // Field doesn't exist in Airtable
  customerNumber: record.fields['Customer number'],
  createdTime: record.createdTime
})