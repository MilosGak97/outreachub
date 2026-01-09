# Template Start Flow (MVP)

> **Strategy**: Build the full template system on backend, but simplify frontend to auto-install a single predefined template for all new users.

---

## Overview

| Aspect | MVP Approach |
|--------|--------------|
| Industry Selection | None - hardcoded to "Movers/Properties" |
| Module Selection | None - auto-install all modules |
| User Experience | Register → Land in fully configured CRM |
| Backend | Full template system ready for future expansion |

---

## Registration Flow

### What User Sees

```
┌─────────────────────────────────────┐
│                                     │
│  Create Your Account                │
│                                     │
│  Company Name  [________________]   │
│  Email         [________________]   │
│  Password      [________________]   │
│                                     │
│  [Create Account]                   │
│                                     │
└─────────────────────────────────────┘
```

**That's it.** No industry picker. No module selection. Just register.

---

### What Backend Does

```
POST /auth/register
{
  companyName: "ABC Properties",
  email: "user@example.com",
  password: "..."
}
```

**Backend steps:**

1. Create Company
2. Create User (as company admin)
3. **Auto-install default template**
   - Template: `movers_properties`
   - Modules: ALL (core, properties, listings, realtors, owners)
4. Return auth token

**User lands in CRM with everything pre-configured.**

---

## Default Template Configuration

```typescript
// config/default-template.config.ts

export const DEFAULT_TEMPLATE = {
  slug: 'movers_properties',
  installAllModules: true,
};
```

Backend registration service uses this config to auto-install.

---

## Template Structure: Movers Properties

### Module Overview

| Module | isCore | Description |
|--------|--------|-------------|
| `core` | Yes | Contact, Company basics |
| `properties` | Yes | Property records |
| `listings` | Yes | For Sale, Pending, Sold status tracking |
| `realtors` | Yes | Realtor agents + Brokerages |
| `owners` | Yes | Property owners |

> **Note**: All marked `isCore: true` for MVP since we auto-install everything. Can change later when we add module selection UI.

---

## Object Definitions

### Core Module

#### `_contact`

| Field | Type | Required | Protection |
|-------|------|----------|------------|
| `_first_name` | STRING | Yes | full |
| `_last_name` | STRING | Yes | full |
| `_email` | EMAIL | No | delete_protected |
| `_phone` | PHONE | No | delete_protected |
| `_notes` | TEXTAREA | No | none |

#### `_company`

| Field | Type | Required | Protection |
|-------|------|----------|------------|
| `_company_name` | STRING | Yes | full |
| `_website` | URL | No | none |
| `_phone` | PHONE | No | none |
| `_address` | ADDRESS | No | none |

---

### Properties Module

#### `_property`

| Field | Type | Required | Protection | Notes |
|-------|------|----------|------------|-------|
| `_address` | ADDRESS | Yes | full | Full address object |
| `_city` | STRING | No | delete_protected | |
| `_state` | SELECT | No | delete_protected | State dropdown |
| `_zip` | STRING | No | delete_protected | |
| `_property_type` | SELECT | No | none | Single Family, Condo, Townhouse, Multi-family |
| `_bedrooms` | NUMBER | No | none | |
| `_bathrooms` | NUMBER | No | none | |
| `_sqft` | NUMBER | No | none | Square footage |
| `_year_built` | NUMBER | No | none | |
| `_lot_size` | NUMBER | No | none | |
| `_notes` | TEXTAREA | No | none | |

---

### Listings Module

#### `_listing`

| Field | Type | Required | Protection | Notes |
|-------|------|----------|------------|-------|
| `_status` | SELECT | Yes | delete_protected | For Sale, Pending, Sold, Off Market |
| `_list_price` | CURRENCY | No | none | |
| `_sold_price` | CURRENCY | No | none | |
| `_list_date` | DATE | No | none | |
| `_pending_date` | DATE | No | none | |
| `_sold_date` | DATE | No | none | |
| `_off_market_date` | DATE | No | none | |
| `_days_on_market` | FORMULA | No | none | Calculate from dates |
| `_mls_number` | STRING | No | none | |

**Status Options:**

| Value | Label | Color (UI hint) |
|-------|-------|-----------------|
| `for_sale` | For Sale | Green |
| `pending` | Pending | Yellow |
| `sold` | Sold | Blue |
| `off_market` | Off Market | Gray |

---

### Realtors Module

#### `_realtor`

| Field | Type | Required | Protection | Notes |
|-------|------|----------|------------|-------|
| `_name` | STRING | Yes | delete_protected | Full name |
| `_email` | EMAIL | No | none | |
| `_phone` | PHONE | No | none | |
| `_license_number` | STRING | No | none | State license |
| `_photo_url` | URL | No | none | Profile photo |

#### `_brokerage`

| Field | Type | Required | Protection | Notes |
|-------|------|----------|------------|-------|
| `_name` | STRING | Yes | delete_protected | Brokerage name |
| `_address` | ADDRESS | No | none | |
| `_phone` | PHONE | No | none | |
| `_website` | URL | No | none | |

---

### Owners Module

#### `_owner`

| Field | Type | Required | Protection | Notes |
|-------|------|----------|------------|-------|
| `_name` | STRING | Yes | delete_protected | Full name or entity name |
| `_email` | EMAIL | No | none | |
| `_phone` | PHONE | No | none | |
| `_mailing_address` | ADDRESS | No | none | May differ from property |
| `_owner_type` | SELECT | No | none | Primary, Secondary, Trust, LLC |

**Owner Type Options:**

| Value | Label |
|-------|-------|
| `primary` | Primary Owner |
| `secondary` | Secondary Owner |
| `trust` | Trust |
| `llc` | LLC |
| `corporation` | Corporation |

---

## Associations (Relationships)

### Core Associations

| Name | Source | Target | Cardinality | Protection |
|------|--------|--------|-------------|------------|
| `_contact_to_company` | `_contact` | `_company` | MANY-to-MANY | delete_protected |

---

### Property Associations

| Name | Source | Target | Cardinality | Protection | Notes |
|------|--------|--------|-------------|------------|-------|
| `_property_contact` | `_property` | `_contact` | MANY-to-MANY | none | Who lives there / lead |
| `_property_owners` | `_property` | `_owner` | ONE-to-MANY | delete_protected | Property has owners |
| `_owner_properties` | `_owner` | `_property` | ONE-to-MANY | none | Owner's portfolio |

---

### Listing Associations

| Name | Source | Target | Cardinality | Protection | Notes |
|------|--------|--------|-------------|------------|-------|
| `_listing_property` | `_listing` | `_property` | MANY-to-ONE | full | Listing belongs to property |
| `_listing_agent` | `_listing` | `_realtor` | MANY-to-ONE | none | Listing agent |
| `_listing_selling_agent` | `_listing` | `_realtor` | MANY-to-ONE | none | Buyer's agent (when sold) |

---

### Realtor Associations

| Name | Source | Target | Cardinality | Protection | Notes |
|------|--------|--------|-------------|------------|-------|
| `_realtor_brokerage` | `_realtor` | `_brokerage` | MANY-to-ONE | none | Works at brokerage |

---

## Visual: Object Relationship Map

```
                    ┌──────────────┐
                    │  _brokerage  │
                    └──────┬───────┘
                           │ MANY-to-ONE
                           │
┌────────────┐      ┌──────▼───────┐      ┌─────────────┐
│  _contact  │      │   _realtor   │      │   _owner    │
└─────┬──────┘      └──────┬───────┘      └──────┬──────┘
      │                    │                     │
      │ MANY-to-MANY       │ (listing agent)     │ ONE-to-MANY
      │                    │                     │
      │              ┌─────▼──────┐              │
      └─────────────►│  _listing  │◄─────────────┘
                     └─────┬──────┘
                           │ MANY-to-ONE
                           │
                     ┌─────▼──────┐
                     │ _property  │
                     └────────────┘
```

---

## API Name Convention

> **Rule**: Template objects start with `_`, user objects cannot.

| Type | Pattern | Example |
|------|---------|---------|
| Template/System | `_[a-z][a-z0-9_]*` | `_property`, `_first_name` |
| User-created | `[a-z][a-z0-9_]*` | `my_field`, `custom_object` |

**Benefits:**
- Zero collision between system and user objects
- Instant visual recognition
- User can have `property`, we have `_property`

---

## Registration Service Logic

```
register(companyName, email, password):

    1. company = createCompany(companyName)

    2. user = createUser(email, password, company, role=ADMIN)

    3. template = getTemplateBySlug(DEFAULT_TEMPLATE.slug)

    4. modules = template.modules.filter(m =>
         DEFAULT_TEMPLATE.installAllModules || m.isCore
       )

    5. for each module in modules:
         for each blueprintObject in module.objects:
           - create CrmObjectType with templateOriginId, protection
           - create CrmObjectFields with templateOriginId, protection

         for each blueprintAssociation in module.associations:
           - resolve source/target apiNames to real IDs
           - create CrmAssociationType with templateOriginId, protection

         - record CompanyInstalledModule

    6. record CompanyTemplate(company, template)

    7. return { user, token }
```

---

## Future Expansion Path

| Phase | User Flow | Backend |
|-------|-----------|---------|
| **MVP (Now)** | Register → Auto-install | Full system ready |
| **V2** | Register → Pick industry → Auto-install | Add industry templates |
| **V3** | Register → Industry → Module selection | Enable module picker |
| **V4** | Register → Industry → Modules → Workspaces | Add sub-tenant layer |

---

## Checklist: What to Build

### Backend

- [ ] Template entities (5 tables)
- [ ] Company tracking entities (2 tables)
- [ ] Add `templateOriginId` + `protection` to existing entities
- [ ] Template installation service
- [ ] Seed `movers_properties` template with all modules
- [ ] Modify registration to auto-install template
- [ ] Add protection checks to delete operations

### Frontend (MVP)

- [ ] Simple registration form (name, email, password)
- [ ] No template/module selection needed
- [ ] User lands in pre-configured CRM

### Data Seeding

- [ ] Core module objects + fields
- [ ] Properties module
- [ ] Listings module with status options
- [ ] Realtors + Brokerages module
- [ ] Owners module
- [ ] All associations between modules

---

## Config Reference

```typescript
// What gets installed for every new company

{
  template: "movers_properties",

  modules: [
    {
      slug: "core",
      objects: ["_contact", "_company"],
      isCore: true
    },
    {
      slug: "properties",
      objects: ["_property"],
      isCore: true
    },
    {
      slug: "listings",
      objects: ["_listing"],
      isCore: true
    },
    {
      slug: "realtors",
      objects: ["_realtor", "_brokerage"],
      isCore: true
    },
    {
      slug: "owners",
      objects: ["_owner"],
      isCore: true
    }
  ],

  totalObjects: 7,
  totalAssociations: 8
}
```

---

## Notes

- All `isCore: true` for MVP (no optional modules yet)
- Protection levels still apply (user can't delete `_property`)
- User can still create custom objects/fields (without `_` prefix)
- Backend ready for future module selection UI
- Template versioning not needed for MVP (single template)