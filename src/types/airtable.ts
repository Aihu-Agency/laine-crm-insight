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
    'Areas of interest'?: string
    'Must have'?: string
    'Nice to have'?: string
    'Neighborhood or address'?: string
    'Salesperson'?: string
    'Source of contact'?: string
    'Property Type'?: string[]
    'Bedrooms'?: number
    'Bathrooms'?: number
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
  areasOfInterest: record.fields['Areas of interest'],
  mustHave: record.fields['Must have'],
  niceToHave: record.fields['Nice to have'],
  neighborhoodOrAddress: record.fields['Neighborhood or address'],
  salesperson: record.fields['Salesperson'],
  sourceOfContact: record.fields['Source of contact'],
  lastContact: undefined, // Field doesn't exist in Airtable
  propertyType: record.fields['Property Type'],
  bedrooms: record.fields['Bedrooms'],
  bathrooms: record.fields['Bathrooms'],
  notes: record.fields['Notes'],
  nextActionDate: record.fields['Next Action Date'],
  nextActionType: record.fields['Next Action Type'],
  nextActionNote: record.fields['Next Action Note'],
  tags: [], // Field doesn't exist in Airtable
  customerNumber: record.fields['Customer number'],
  createdTime: record.createdTime
})