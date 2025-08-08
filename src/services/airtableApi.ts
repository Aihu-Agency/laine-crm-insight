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

  async createCustomer(customerData: Partial<Customer>): Promise<Customer & { _warnings?: string[] }> {
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

      // Sanitize inputs
      const AREA_ALLOWED = [
        'Marbella', 'Puerto Banus', 'Malaga', 'Fuengirola', 'Mijas', 'Torremolinos', 'Other'
      ] as const;
      const rawAreas = customerData.areasOfInterest
        ? customerData.areasOfInterest.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const sanitizedAreas = rawAreas.filter(a => AREA_ALLOWED.includes(a as any));
      const invalidAreas = rawAreas.filter(a => !AREA_ALLOWED.includes(a as any));

      const airtableFieldsBase: Record<string, any> = {
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
        'Areas of interest': sanitizedAreas.length ? sanitizedAreas : undefined,
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
      };

      // Remove undefined values and empty strings to avoid Airtable errors
      const cleanFields = Object.keys(airtableFieldsBase).reduce((acc: Record<string, any>, key) => {
        const value = airtableFieldsBase[key];
        if (!(value === undefined || value === '')) acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      let warnings: string[] = [];
      if (invalidAreas.length) {
        warnings.push(`Ignored invalid Areas of interest: ${invalidAreas.join(', ')}`);
      }

      try {
        const record: AirtableCustomer = await this.makeRequest('/customers', {
          method: 'POST',
          body: cleanFields,
        });

        // Optionally create a linked Customer Action
        if ((customerData.nextActionDate || customerData.nextActionNote) && record?.id) {
          const actionDate = customerData.nextActionDate || new Date().toISOString().slice(0, 10);
          const actionDescription = customerData.nextActionNote || 'Follow up';
          try {
            await this.createCustomerAction(record.id, { actionDescription, actionDate });
          } catch (e) {
            console.warn('Failed to create initial customer action:', e);
          }
        }

        const transformed = transformAirtableCustomer(record) as Customer & { _warnings?: string[] };
        if (warnings.length) transformed._warnings = warnings;
        return transformed;
      } catch (err: any) {
        const msg = (err && (err.message || err.toString())) || '';
        if (msg.includes('422')) {
          // Retry without Areas of interest
          const retryFields = { ...cleanFields };
          if (retryFields['Areas of interest']) delete retryFields['Areas of interest'];
          warnings.push('Areas of interest were removed due to invalid values.');

          const record: AirtableCustomer = await this.makeRequest('/customers', {
            method: 'POST',
            body: retryFields,
          });
          const transformed = transformAirtableCustomer(record) as Customer & { _warnings?: string[] };
          if (warnings.length) transformed._warnings = warnings;
          return transformed;
        }
        throw err;
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer & { _warnings?: string[] }> {
    try {
      // Sanitize inputs
      const AREA_ALLOWED = [
        'Marbella', 'Puerto Banus', 'Malaga', 'Fuengirola', 'Mijas', 'Torremolinos', 'Other'
      ] as const;
      const rawAreas = customerData.areasOfInterest
        ? customerData.areasOfInterest.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const sanitizedAreas = rawAreas.filter(a => AREA_ALLOWED.includes(a as any));
      const invalidAreas = rawAreas.filter(a => !AREA_ALLOWED.includes(a as any));

      const airtableFieldsBase: Record<string, any> = {
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
        'Areas of interest': sanitizedAreas.length ? sanitizedAreas : undefined,
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
        'Next Action Type': customerData.nextActionType,
        'Next Action Note': customerData.nextActionNote,
        'Customer number': customerData.customerNumber,
      };

      // Remove undefined values and empty strings
      const cleanFields = Object.keys(airtableFieldsBase).reduce((acc: Record<string, any>, key) => {
        const value = airtableFieldsBase[key];
        if (!(value === undefined || value === '')) acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      let warnings: string[] = [];
      if (invalidAreas.length) {
        warnings.push(`Ignored invalid Areas of interest: ${invalidAreas.join(', ')}`);
      }

      try {
        const record: AirtableCustomer = await this.makeRequest(`/customers/${id}`, {
          method: 'PATCH',
          body: cleanFields,
        });
        const transformed = transformAirtableCustomer(record) as Customer & { _warnings?: string[] };
        if (warnings.length) transformed._warnings = warnings;
        return transformed;
      } catch (err: any) {
        const msg = (err && (err.message || err.toString())) || '';
        if (msg.includes('422')) {
          const retryFields = { ...cleanFields };
          if (retryFields['Areas of interest']) delete retryFields['Areas of interest'];
          warnings.push('Areas of interest were removed due to invalid values.');
          const record: AirtableCustomer = await this.makeRequest(`/customers/${id}`, {
            method: 'PATCH',
            body: retryFields,
          });
          const transformed = transformAirtableCustomer(record) as Customer & { _warnings?: string[] };
          if (warnings.length) transformed._warnings = warnings;
          return transformed;
        }
        throw err;
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }

  // Customer Actions methods
  async getCustomerActions(customerId: string): Promise<CustomerAction[]> {
    try {
      const params = new URLSearchParams()
      params.set('customerId', customerId)
      const data: AirtableCustomerActionResponse = await this.makeRequest(`/customer-actions?${params.toString()}`)
      return data.records.map(transformAirtableCustomerAction)
    } catch (error) {
      console.error('Error fetching customer actions:', error)
      throw error
    }
  }

  async createCustomerAction(customerId: string, actionData: { actionDescription: string; actionDate: string }): Promise<CustomerAction> {
    try {
      const fields = {
        'Action Description': actionData.actionDescription,
        'Action Date': actionData.actionDate,
        'Customer': [customerId],
      }

      const record: AirtableCustomerAction = await this.makeRequest('/customer-actions', {
        method: 'POST',
        body: fields,
      })

      return transformAirtableCustomerAction(record)
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

  async markActionAsUncompleted(actionId: string): Promise<CustomerAction> {
    try {
      const airtableFields = {
        'Completed': null as unknown as undefined
      }

      const record: AirtableCustomerAction = await this.makeRequest(`/customer-actions/${actionId}`, {
        method: 'PATCH',
        body: airtableFields,
      })

      return transformAirtableCustomerAction(record)
    } catch (error) {
      console.error('Error undoing completed action:', error)
      throw error
    }
  }

  async deleteCustomerAction(actionId: string): Promise<{ success: true }> {
    try {
      await this.makeRequest(`/customer-actions/${actionId}`, {
        method: 'DELETE',
      })
      return { success: true }
    } catch (error) {
      console.error('Error deleting customer action:', error)
      throw error
    }
  }
}

export const airtableApi = new AirtableApiService()