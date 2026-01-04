# Laine Homes CRM - System Architecture

## 1. Business Context

**Company**: Laine Homes - Finnish real estate agency helping Finns buy property in Costa del Sol, Spain

**Purpose**: CRM system for managing property buyers through the sales process

**Target Users**: Finnish buyers looking for holiday homes, investments, or permanent residences in Spain

---

## 2. System Architecture

```
                              LAINE HOMES CRM ARCHITECTURE
                              
+------------------+          +------------------------+          +------------------+
|                  |   API    |                        |   API    |                  |
|  React Frontend  |--------->|   Supabase Cloud       |--------->|    Airtable      |
|  (Lovable)       |<---------|                        |<---------|    (Database)    |
|                  |          |                        |          |                  |
|  - Dashboard     |          |  Edge Functions:       |          |  Tables:         |
|  - Customers     |          |  - airtable-proxy      |          |  - Customers     |
|  - Sales Funnel  |          |  - import-customers    |          |  - Properties    |
|  - Todo          |          |  - user-admin          |          |  - Customer      |
|  - Settings      |          |  - fix-phone-numbers   |          |    Actions       |
|                  |          |  - mailchimp-sync      |          |                  |
+------------------+          +------------------------+          +------------------+
        |                              |       |
        |                              |       +----------------------+
        v                              v                              |
+------------------+          +------------------+          +------------------+
|                  |          |                  |          |                  |
|  Supabase Auth   |          |    Mailchimp     |          |  External        |
|  & Database      |          |    (Email)       |          |  Scrapers        |
|                  |          |                  |          |                  |
|  - profiles      |          |  Sync new buyers |          |  - Idealista     |
|  - user_roles    |          |  to mailing list |          |  - Laine Homes   |
+------------------+          +------------------+          +------------------+
```

---

## 3. User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Sales Agent** | Individual salespeople managing their customers | View/edit own customers, create actions, view properties |
| **Manager (Admin)** | Team leads with full access | View all customers, manage users, access settings, import customers |

---

## 4. Data Storage

### Supabase Tables (Authentication & Authorization)

| Table | Fields | Purpose |
|-------|--------|---------|
| `profiles` | id, first_name, last_name, last_login, created_at, updated_at | User profiles |
| `user_roles` | id, user_id, role, created_at | Role assignments (admin/user) |

### Airtable Tables (Business Data)

#### Customers Table

| Field | Type | Purpose |
|-------|------|---------|
| Customer number | Number | Unique identifier |
| First name / Last name | Text | Contact name |
| Email / Phone | Contact | Communication |
| Customer type | Single select | Buyer / Seller / Renter |
| Customer category | Multi-select | Holiday home / Investor / Primary residence |
| Areas of interest | Multi-select | Geographic preferences (Fuengirola, Marbella, etc.) |
| Bedrooms / Bathrooms | Multi-select | Property requirements |
| Min price / Max price | Number | Budget range |
| Time of purchase | Text | Purchase timeline |
| Sales person | Text | Assigned agent |
| Idealista done / Laine Done | Checkbox | Scraping status |
| Active Search Date | Date | When actively searching |
| Language | Single select | Customer's preferred language |

#### Properties Table

| Field | Type | Purpose |
|-------|------|---------|
| Title | Text | Property listing title |
| Price | Text | Listing price |
| Bedrooms / Bathrooms | Number | Property specs |
| Area m2 | Text | Property size |
| Property Type | Single select | Apartment / Villa / etc. |
| Partner Source | Text | Lainehomes / Idealista |
| Customers | Link | Linked interested buyers |
| property_detail_url | URL | Original listing link |
| Analysis / Summary | Lookup | AI-generated analysis |

#### Customer Actions Table

| Field | Type | Purpose |
|-------|------|---------|
| Action Number | Number | Unique identifier |
| Action Date | Date | When action is due |
| Action Description | Text | Task description |
| Completed | Single select | Done / (empty for pending) |
| Customer | Link | Related customer record |

---

## 5. Edge Functions

| Function | Purpose | Trigger |
|----------|---------|---------|
| `airtable-proxy` | Proxies all CRUD operations to Airtable | Frontend API calls |
| `import-customers` | Bulk CSV import with duplicate checking | Import page |
| `user-admin` | List salespeople, admin operations | Settings, forms |
| `fix-phone-numbers` | Data cleanup utility | Manual trigger |
| `mailchimp-sync` | Sync new buyers to Mailchimp audience | After customer creation (Buyer type) |

---

## 6. External Integrations

### Property Scrapers (Inbound)

| Scraper | Source | Purpose |
|---------|--------|---------|
| Idealista Scraper | idealista.com | Automatically scrapes property listings and imports to Properties table |
| Laine Homes Scraper | lainehomes.es | Scrapes listings from company website |

Both scrapers update the `Idealista done` / `Laine Done` fields on Customers to track scraping status.

### Mailchimp (Outbound)

| Aspect | Details |
|--------|---------|
| **Trigger** | When a new customer with type "Buyer" is created |
| **Action** | Add contact to Mailchimp audience list |
| **Data synced** | Email, First name, Last name, Language |
| **Purpose** | Automated email marketing campaigns to buyers |

---

## 7. Data Flow Diagrams

### New Buyer Flow (with Mailchimp Sync)

```
User fills      Frontend calls     Edge Function      Airtable creates
AddClientForm → airtableApi.create → airtable-proxy → Customer record
                                           ↓
                                    mailchimp-sync → Mailchimp adds
                                                     contact to list
                                           ↓
Success toast ← Response returned ← Customer ID returned
```

### Property Matching Flow

```
Customer preferences    →    Query Properties    →    Filter by:
(areas, price, beds)         from Airtable           - Areas match
                                                     - Price in range
                                                     - Bedroom count
                                    ↓
                         Display Linked Properties
                         on Customer View page
```

### Authentication Flow

```
User login → Supabase Auth → JWT token issued
                  ↓
           Profile lookup → Role check (admin/user)
                  ↓
           UI renders based on role permissions
```

---

## 8. Key Application Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview with pending tasks, new properties count, quick add customer |
| **Customer List** | Filterable list by salesperson, area, timeline, archived status |
| **Customer Detail** | Full profile with preferences, actions, linked properties |
| **Sales Funnel** | Customers organized by purchase timeline stages |
| **Todo / Tasks** | Pending follow-up tasks across all customers |
| **Import** | Bulk CSV import with duplicate detection |
| **Settings** | User management (admin only) |

---

## 9. Security Model

| Layer | Implementation |
|-------|----------------|
| **Authentication** | Supabase Auth with email/password |
| **Authorization** | Role-based (admin vs regular user) |
| **RLS Policies** | On profiles and user_roles tables |
| **API Security** | Edge functions verify JWT tokens |
| **Secrets** | Airtable API key, Mailchimp credentials stored in Supabase Edge Function secrets |

### Role-Based Access Control

- **Admins**: Can view all customers, manage users, toggle "Show everyone's Tasks"
- **Users**: Can only view customers assigned to them, see only their own tasks

---

## 10. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | TanStack React Query |
| Routing | React Router |
| Backend | Supabase (Auth, Edge Functions) |
| Database | Airtable (business data), Supabase (auth data) |
| Email Marketing | Mailchimp |

---

## 11. File Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Navigation.tsx   # App navigation
│   └── ...              # Feature components
├── pages/
│   ├── Index.tsx        # Landing/login page
│   ├── Customers.tsx    # Customer list
│   ├── CustomerView.tsx # Customer detail
│   ├── SalesFunnel.tsx  # Funnel view
│   ├── Todo.tsx         # Tasks page
│   └── Settings.tsx     # Admin settings
├── services/
│   └── airtableApi.ts   # API service layer
├── types/
│   ├── airtable.ts      # Airtable data types
│   └── filters.ts       # Filter types
└── constants/
    └── areas.ts         # Area definitions

supabase/
├── functions/
│   ├── airtable-proxy/  # Main API proxy
│   ├── import-customers/# CSV import
│   ├── user-admin/      # User management
│   ├── fix-phone-numbers/# Data cleanup
│   └── mailchimp-sync/  # Email sync
└── config.toml          # Edge function config
```
