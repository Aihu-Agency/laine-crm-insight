import { Customer, AirtableResponse, AirtableCustomer, transformAirtableCustomer } from '@/types/airtable'

const API_BASE_URL = '/api/airtable-proxy'

class AirtableApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
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
      const airtableFields = {
        'Full Name': customerData.fullName || '',
        'Phone': customerData.phone,
        'Email': customerData.email,
        'Phase': customerData.phase || 'New Lead',
        'Location': customerData.location,
        'Budget Range': customerData.budgetRange,
        'Salesperson': customerData.salesperson,
        'Last Contact': customerData.lastContact,
        'Property Type': customerData.propertyType,
        'Bedrooms': customerData.bedrooms,
        'Bathrooms': customerData.bathrooms,
        'Notes': customerData.notes,
        'Next Action Date': customerData.nextActionDate,
        'Next Action Type': customerData.nextActionType,
        'Tags': customerData.tags,
      }

      const record: AirtableCustomer = await this.makeRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(airtableFields),
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
        'Full Name': customerData.fullName,
        'Phone': customerData.phone,
        'Email': customerData.email,
        'Phase': customerData.phase,
        'Location': customerData.location,
        'Budget Range': customerData.budgetRange,
        'Salesperson': customerData.salesperson,
        'Last Contact': customerData.lastContact,
        'Property Type': customerData.propertyType,
        'Bedrooms': customerData.bedrooms,
        'Bathrooms': customerData.bathrooms,
        'Notes': customerData.notes,
        'Next Action Date': customerData.nextActionDate,
        'Next Action Type': customerData.nextActionType,
        'Tags': customerData.tags,
      }

      // Remove undefined values
      Object.keys(airtableFields).forEach(key => {
        if (airtableFields[key as keyof typeof airtableFields] === undefined) {
          delete airtableFields[key as keyof typeof airtableFields]
        }
      })

      const record: AirtableCustomer = await this.makeRequest(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(airtableFields),
      })

      return transformAirtableCustomer(record)
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }
}

export const airtableApi = new AirtableApiService()