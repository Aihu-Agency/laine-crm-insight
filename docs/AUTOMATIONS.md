# Automations Documentation

This document describes the automated property scraping and analysis system for Laine Homes CRM.

---

## Overview

The automation system consists of two layers:

1. **Airtable Automations** - Simple status-setting triggers that queue records for processing
2. **n8n Workflows** - Complex workflows that perform the actual scraping and AI analysis

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Airtable     │────▶│      n8n        │────▶│    Airtable     │
│  (Set Status)   │     │   (Workers)     │     │  (Store Data)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ External APIs   │
                    │ - Airtop        │
                    │ - OpenRouter    │
                    │ - Slack         │
                    └─────────────────┘
```

---

## Airtable Automations

These automations set status fields to trigger n8n workflows via webhooks.

### Idealista Status Setter
- **Trigger**: When a new Idealista property URL is added
- **Action**: Sets `Idealista done` field to trigger scraping workflow

### Laine Homes Status Setter
- **Trigger**: When a new Laine Homes property URL is added
- **Action**: Sets `Laine Done` field to trigger scraping workflow

---

## n8n Workflows

### 1. Laine Homes Property Scrape

**Purpose**: Scrapes new property listings from Laine Homes website and stores them in Airtable.

**Trigger**: Webhook from Airtable (when `Laine Done` status is set)

**Process Flow**:
1. Receives property URL from Airtable webhook
2. Uses **Airtop** browser automation to navigate to property page
3. Extracts property details:
   - Title, price, description
   - Area (m²), number of rooms
   - Property images
4. Creates new record in Airtable `Properties` table
5. Links property to relevant customers based on preferences
6. Sends Slack notification on completion

**External Services**:
- Airtop (browser automation)
- Airtable (data storage)
- Slack (notifications)

---

### 2. Idealista Property Scrape

**Purpose**: Scrapes property listings from Idealista with anti-bot handling.

**Trigger**: Webhook from Airtable (when `Idealista done` status is set)

**Process Flow**:
1. Receives property URL from Airtable webhook
2. Uses **Airtop** with proxy rotation for anti-bot bypass
3. Handles CAPTCHA challenges automatically
4. Extracts comprehensive property details:
   - Title, price, description
   - Area, bedrooms, bathrooms
   - Features list, amenities
   - All property images
5. Creates/updates record in Airtable `Properties` table
6. Links to matching customers
7. Sends Slack notification

**External Services**:
- Airtop (browser automation)
- Proxy service (anti-bot bypass)
- Airtable (data storage)
- Slack (notifications)

**Note**: More complex than Laine Homes scraper due to Idealista's anti-bot measures.

---

### 3. Laine Homes Image Analysis

**Purpose**: AI-powered analysis of property images for Finnish-speaking clients.

**Trigger**: Webhook from Airtable (after property scraping completes)

**Process Flow**:
1. Receives property record from Airtable
2. Uses Airtop to navigate to property page and click "Lisää kuvia" (More images)
3. Extracts all image URLs
4. Downloads each image individually
5. **Per-image analysis** using GPT-4o-mini (via OpenRouter):
   - Room type identification
   - Condition assessment
   - Notable features
   - All responses in Finnish
6. **Synthesis** using GPT-5.1 (via OpenRouter):
   - Comprehensive property report
   - Investment suitability rating
   - Recommendations for Finnish buyers
7. Updates `Properties` table with analysis
8. Creates record in `Properties Analysis` table

**AI Prompts**: Tailored for Finnish real estate context with focus on:
- Condition and renovation needs
- Investment potential
- Suitability for Finnish lifestyle

**External Services**:
- Airtop (browser automation)
- OpenRouter (GPT-4o-mini, GPT-5.1)
- Airtable (data storage)

---

### 4. Idealista Image Analysis

**Purpose**: AI-powered analysis of Idealista property images.

**Trigger**: Webhook from Airtable (after Idealista scraping completes)

**Process Flow**:
1. Receives property record from Airtable
2. Uses Airtop to extract all images from Idealista listing
3. Extracts structured data:
   - Property details (price, area, rooms)
   - Features and amenities lists
   - All image URLs
4. Downloads and analyzes each image with GPT-4o-mini
5. Synthesizes comprehensive report with GPT-5.1
6. Updates `Properties` table
7. Creates `Properties Analysis` record

**Note**: Extracts more structured data than Laine Homes version due to Idealista's detailed listings.

**External Services**:
- Airtop (browser automation)
- OpenRouter (GPT-4o-mini, GPT-5.1)
- Airtable (data storage)

---

## External Services

| Service | Purpose | Used By |
|---------|---------|---------|
| **Airtop** | Browser automation, web scraping | All 4 workflows |
| **OpenRouter** | LLM API gateway (GPT-4o-mini, GPT-5.1) | Image analysis workflows |
| **Proxy Service** | IP rotation for anti-bot bypass | Idealista workflows |
| **Slack** | Notifications | Scraping workflows |
| **Airtable** | Data storage, workflow triggers | All workflows |

---

## Data Flow

### Property Lifecycle

```
1. New URL added to Airtable
         │
         ▼
2. Airtable automation sets status flag
         │
         ▼
3. n8n scraping workflow triggered
         │
         ▼
4. Property details extracted and stored
         │
         ▼
5. Property linked to matching customers
         │
         ▼
6. n8n analysis workflow triggered
         │
         ▼
7. AI analysis stored in Properties Analysis table
```

### Airtable Tables Affected

| Table | Operations |
|-------|------------|
| `Properties` | Create, Update, Read |
| `Properties Analysis` | Create |
| `Customers` | Read (for matching), Update (link properties) |

---

## Troubleshooting

### Common Issues

1. **Scraping fails on Idealista**
   - Check proxy service status
   - Verify Airtop session is active
   - Review CAPTCHA handling logs

2. **Image analysis incomplete**
   - Check OpenRouter API limits
   - Verify image URLs are accessible
   - Review n8n execution logs

3. **Properties not linked to customers**
   - Verify customer preferences match property area
   - Check customer status is active

### Monitoring

- n8n provides execution history for all workflows
- Slack notifications alert on scraping completion
- Airtable automation history shows trigger events
