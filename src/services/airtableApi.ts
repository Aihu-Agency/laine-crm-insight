import { Customer, AirtableResponse, AirtableCustomer, transformAirtableCustomer, CustomerAction, AirtableCustomerActionResponse, AirtableCustomerAction, transformAirtableCustomerAction } from '@/types/airtable'
import { supabase } from '@/integrations/supabase/client'

class AirtableApiService {
  private async makeRequest(endpoint: string, options: { method?: string; body?: any } = {}) {
    const { data, error } = await supabase.functions.invoke('airtable-proxy', {
      body: {
        endpoint,
        method: options.method || 'GET',
        data: options.body
      }
    })

    if (error) {
      console.error('Supabase function error:', error)
      throw new Error(`Airtable API error: ${error.message}`)
    }

    return data
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      const data: AirtableResponse = await this.makeRequest('/customers')
      return data.records.map(transformAirtableCustomer)
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
  }

  async getCustomer(id: string): Promise<Customer | null> {
    try {
      const record: AirtableCustomer = await this.makeRequest(`/customers/${id}`)
      return transformAirtableCustomer(record)
    } catch (error) {
      console.error('Error fetching customer:', error)
      return null
    }
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    try {
      // Get next customer number with fallback handling
      let nextCustomerNumber = 1001; // Default starting number
      
      try {
        const customers = await this.getCustomers();
        const customerNumbers = customers
          .map(c => c.customerNumber)
          .filter(num => num !== undefined && num !== null) as number[];
        
        if (customerNumbers.length > 0) {
          nextCustomerNumber = Math.max(...customerNumbers) + 1;
        }
      } catch (error) {
        console.warn('Could not fetch existing customers for number generation, using default:', error);
        // nextCustomerNumber remains 1001
      }

      const airtableFields = {
        'First name': customerData.firstName || '',
        'Last name': customerData.lastName || '',
        'Phone number': customerData.phone,
        'Email': customerData.email,
        'Language': customerData.language,
        'Customer type': customerData.customerType,
        'Customer category': customerData.customerCategory,
        'Time of purchase': customerData.timeOfPurchase,
        'Min price': customerData.minPrice,
        'Max price': customerData.maxPrice,
        'Areas of interest': customerData.areasOfInterest ? customerData.areasOfInterest.split(', ').filter(area => area.trim()) : undefined,
        'Must have': customerData.mustHave,
        'Nice to have': customerData.niceToHave,
        'Neighborhood or address': customerData.neighborhoodOrAddress,
        'Sales person': customerData.salesperson,
        'Source of contact': customerData.sourceOfContact,
        'Type of apartment': customerData.propertyType,
        'Bedrooms': customerData.bedrooms ? [customerData.bedrooms.toString()] : undefined,
        'Bathrooms': customerData.bathrooms ? [customerData.bathrooms.toString()] : undefined,
        'Notes': customerData.notes,
        'Next Action Date': customerData.nextActionDate,
        'Next Action Note': customerData.nextActionNote,
        'Customer number': nextCustomerNumber,
      }

      // Remove undefined values and empty strings to avoid Airtable errors
      Object.keys(airtableFields).forEach(key => {
        const value = airtableFields[key as keyof typeof airtableFields]
        if (value === undefined || value === '') {
          delete airtableFields[key as keyof typeof airtableFields]
        }
      })

      const record: AirtableCustomer = await this.makeRequest('/customers', {
        method: 'POST',
        body: airtableFields,
      })

      return transformAirtableCustomer(record)
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
    try {
      const airtableFields = {
        'First name': customerData.firstName,
        'Last name': customerData.lastName,
        'Phone number': customerData.phone,
        'Email': customerData.email,
        'Language': customerData.language,
        'Customer type': customerData.customerType,
        'Customer category': customerData.customerCategory,
        'Time of purchase': customerData.timeOfPurchase,
        'Min price': customerData.minPrice,
        'Max price': customerData.maxPrice,
        'Areas of interest': customerData.areasOfInterest ? customerData.areasOfInterest.split(', ').filter(area => area.trim()) : undefined,
        'Must have': customerData.mustHave,
        'Nice to have': customerData.niceToHave,
        'Neighborhood or address': customerData.neighborhoodOrAddress,
        'Sales person': customerData.salesperson,
        'Source of contact': customerData.sourceOfContact,
        'Type of apartment': customerData.propertyType,
        'Bedrooms': customerData.bedrooms ? [customerData.bedrooms.toString()] : undefined,
        'Bathrooms': customerData.bathrooms ? [customerData.bathrooms.toString()] : undefined,
        'Notes': customerData.notes,
        'Next Action Date': customerData.nextActionDate,
        'Next Action Note': customerData.nextActionNote,
        'Customer number': customerData.customerNumber,
      }

      // Remove undefined values and empty strings
      Object.keys(airtableFields).forEach(key => {
        const value = airtableFields[key as keyof typeof airtableFields]
        if (value === undefined || value === '') {
          delete airtableFields[key as keyof typeof airtableFields]
        }
      })

      const record: AirtableCustomer = await this.makeRequest(`/customers/${id}`, {
        method: 'PATCH',
        body: airtableFields,
      })

      return transformAirtableCustomer(record)
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }

  // Customer Actions methods
  async getCustomerActions(customerId: string): Promise<CustomerAction[]> {
    try {
      // Fetch actions and filter on client to handle various linked field names
      const data: AirtableCustomerActionResponse = await this.makeRequest(`/customer-actions`)
      return data.records
        .filter(record => {
          const linked = (record.fields['Customers'] || record.fields['Customer']) as string[] | undefined
          return Array.isArray(linked) ? linked.includes(customerId) : false
        })
        .filter(record => record.fields['Action Description'] && record.fields['Action Date'])
        .map(transformAirtableCustomerAction)
    } catch (error) {
      console.error('Error fetching customer actions:', error)
      throw error
    }
  }

  async createCustomerAction(customerId: string, actionData: { actionDescription: string; actionDate: string }): Promise<CustomerAction> {
    try {
      // Prefer the linked record field 'Customer' (singular), fallback to 'Customers'
      const baseFields = {
        'Action Description': actionData.actionDescription,
        'Action Date': actionData.actionDate,
      }

      // 1) Try with 'Customer'
      try {
        const record: AirtableCustomerAction = await this.makeRequest('/customer-actions', {
          method: 'POST',
          body: { ...baseFields, 'Customer': [customerId] },
        })
        return transformAirtableCustomerAction(record)
      } catch (firstError) {
        console.warn('Create action with field "Customer" failed, retrying with "Customers". Error:', firstError)
        // 2) Fallback to 'Customers'
        const record: AirtableCustomerAction = await this.makeRequest('/customer-actions', {
          method: 'POST',
          body: { ...baseFields, 'Customers': [customerId] },
        })
        return transformAirtableCustomerAction(record)
      }
    } catch (error) {
      console.error('Error creating customer action:', error)
      throw error
    }
  }

  async markActionAsCompleted(actionId: string): Promise<CustomerAction> {
    try {
      const airtableFields = {
        'Completed': 'Done'
      }

      const record: AirtableCustomerAction = await this.makeRequest(`/customer-actions/${actionId}`, {
        method: 'PATCH',
        body: airtableFields,
      })

      return transformAirtableCustomerAction(record)
    } catch (error) {
      console.error('Error marking action as completed:', error)
      throw error
    }
  }
}

export const airtableApi = new AirtableApiService()