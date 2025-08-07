import { Customer, AirtableResponse, AirtableCustomer, transformAirtableCustomer } from '@/types/airtable'

class AirtableApiService {
  private async makeRequest(endpoint: string, options: { method?: string; body?: any } = {}) {
    const response = await fetch('/api/airtable-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        method: options.method || 'GET',
        data: options.body
      })
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
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
        'Areas of interest': customerData.areasOfInterest,
        'Must have': customerData.mustHave,
        'Nice to have': customerData.niceToHave,
        'Neighborhood or address': customerData.neighborhoodOrAddress,
        'Sales person': customerData.salesperson,
        'Source of contact': customerData.sourceOfContact,
        'Type of apartment': customerData.propertyType,
        'Bedrooms': customerData.bedrooms,
        'Bathrooms': customerData.bathrooms,
        'Notes': customerData.notes,
        'Next Action Date': customerData.nextActionDate,
        'Next Actions': customerData.nextActionType,
        'Next Action Note': customerData.nextActionNote,
        'Customer number': nextCustomerNumber,
      }

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
        'Areas of interest': customerData.areasOfInterest,
        'Must have': customerData.mustHave,
        'Nice to have': customerData.niceToHave,
        'Neighborhood or address': customerData.neighborhoodOrAddress,
        'Sales person': customerData.salesperson,
        'Source of contact': customerData.sourceOfContact,
        'Type of apartment': customerData.propertyType,
        'Bedrooms': customerData.bedrooms,
        'Bathrooms': customerData.bathrooms,
        'Notes': customerData.notes,
        'Next Action Date': customerData.nextActionDate,
        'Next Actions': customerData.nextActionType,
        'Next Action Note': customerData.nextActionNote,
        'Customer number': customerData.customerNumber,
      }

      // Remove undefined values
      Object.keys(airtableFields).forEach(key => {
        if (airtableFields[key as keyof typeof airtableFields] === undefined) {
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
}

export const airtableApi = new AirtableApiService()