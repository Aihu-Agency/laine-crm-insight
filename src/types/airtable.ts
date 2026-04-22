export interface AirtableCustomer {
  id: string
  fields: {
    'First name': string
    'Last name': string
    'Phone number'?: string
    'Email'?: string
    'Language'?: string
    'Customer type'?: string
    'Customer category'?: string[]
    'Time of purchase'?: string
    'Min price'?: number
    'Max price'?: number
    'Areas of interest'?: string[]
    'Must have'?: string
    'Nice to have'?: string
    'Views'?: string[]
    'Orientation'?: string[]
    'Other features'?: string[]
    'Condition'?: string[]
    'Neighborhood or address'?: string
    'Sales person'?: string
    'Source of contact'?: string[]
    'Type of apartment'?: string[]
    'Bedrooms'?: string[]
    'Bathrooms'?: string[]
    'Notes'?: string
    'Next Action Date'?: string
    'Next Action Type'?: string
    'Next Action Note'?: string
    'Customer number'?: number
    'Properties'?: string[]
    'Marketing permission'?: boolean
    'Active Search Date'?: string
    'Is Active?'?: boolean | string
  }
  createdTime: string
}

export interface AirtableProperty {
  id: string
  fields: {
    'Title'?: string
    'Property Type'?: string
    'Bedrooms'?: number
    'Bathrooms'?: number
    'Price €'?: number
    'Area m²'?: string
    'Summary'?: string
    'property_detail_url'?: string
    'ID'?: string
    'Location'?: string
    'Areas'?: string[]
  }
  createdTime: string
}

export interface AirtablePropertiesResponse {
  records: AirtableProperty[]
  offset?: string
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
  customerCategory?: string[]
  timeOfPurchase?: string
  minPrice?: number
  maxPrice?: number
  areasOfInterest?: string
  mustHave?: string
  niceToHave?: string
  views?: string[]
  orientation?: string[]
  otherFeatures?: string[]
  condition?: string[]
  neighborhoodOrAddress?: string
  salesperson?: string
  sourceOfContact?: string | string[]
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
  propertyIds?: string[]
  marketingPermission?: boolean
  activeSearchDate?: string
  archived?: boolean
  createdTime: string
}

export interface Property {
  id: string
  title?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  price?: number
  area?: string
  summary?: string
  propertyDetailUrl?: string
  propertyIdUrl?: string
  location?: string
  areas?: string[]
  createdTime: string
}

// Transform Airtable record to our Customer interface
// Customer Action interfaces
export interface AirtableCustomerAction {
  id: string
  fields: {
    'Customer Action'?: number
    'Customer number'?: string[]
    'Customer'?: string[]
    'Customers'?: string[]
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
  customerId?: string
  actionDescription: string
  completed: boolean
  actionDate: string
  customerName?: string
  customerSalesperson?: string
  createdTime: string
}

// Transform Airtable customer action record to our CustomerAction interface
export const transformAirtableCustomerAction = (record: AirtableCustomerAction): CustomerAction => ({
  id: record.id,
  customerActionNumber: record.fields['Customer Action'],
  customerNumber: record.fields['Customer number'],
  customerId: record.fields['Customer']?.[0] || record.fields['Customers']?.[0],
  actionDescription: record.fields['Action Description'] || '',
  completed: record.fields['Completed'] === 'Done',
  actionDate: record.fields['Action Date'] || '',
  customerName: (record.fields as any)['_customerName'] || undefined,
  customerSalesperson: (record.fields as any)['_customerSalesperson'] || undefined,
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
  customerCategory: (() => {
    const cc: any = (record.fields as any)['Customer category'];
    if (!cc) return [];
    return Array.isArray(cc) ? cc : [cc];
  })(),
  timeOfPurchase: record.fields['Time of purchase'],
  minPrice: record.fields['Min price'],
  maxPrice: record.fields['Max price'],
  areasOfInterest: record.fields['Areas of interest']?.join(', '),
  mustHave: record.fields['Must have'],
  niceToHave: record.fields['Nice to have'],
  views: record.fields['Views'] || [],
  orientation: record.fields['Orientation'] || [],
  otherFeatures: record.fields['Other features'] || [],
  condition: record.fields['Condition'] || [],
  neighborhoodOrAddress: record.fields['Neighborhood or address'],
  salesperson: record.fields['Sales person'],
  sourceOfContact: Array.isArray(record.fields['Source of contact']) 
    ? record.fields['Source of contact'].join(', ') 
    : record.fields['Source of contact'],
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
  propertyIds: record.fields['Properties'] || [],
  marketingPermission: record.fields['Marketing permission'],
  activeSearchDate: record.fields['Active Search Date'],
  archived: (() => {
    const activeValue = record.fields['Is Active?']
    if (typeof activeValue === 'boolean') return !activeValue
    if (typeof activeValue === 'string') return activeValue.trim().toLowerCase() === 'false'
    return false
  })(),
  createdTime: record.createdTime
})

export const transformAirtableProperty = (record: AirtableProperty): Property => ({
  id: record.id,
  title: record.fields['Title'],
  propertyType: record.fields['Property Type'],
  bedrooms: record.fields['Bedrooms'],
  bathrooms: record.fields['Bathrooms'],
  price: record.fields['Price €'],
  area: record.fields['Area m²'],
  summary: record.fields['Summary'],
  propertyDetailUrl: record.fields['property_detail_url'],
  propertyIdUrl: record.fields['ID'],
  location: record.fields['Location'],
  areas: record.fields['Areas'],
  createdTime: record.createdTime
})