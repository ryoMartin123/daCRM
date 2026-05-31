# CRM Modules — Navigation Plan & Build Order

## Sidebar navigation

```
Work
  Dashboard
  Inbox
  Calendar
  Tasks

Records
  Customers         ← Phase 1  ✓ built
  Leads             ← Phase 1  (in progress)
  Quotes            ← Phase 2  (placeholder)
  Jobs              ← Phase 1  (in progress)
  Work Orders       ← Phase 2  (placeholder)
  Projects          ← Phase 2  (placeholder)
  Invoices          ← Phase 2  (placeholder)
  Agreements        ← Phase 4
  Photos & Files    ← Phase 3

Grow
  Marketing         ← Phase 5
  Reports           ← Phase 6

Account
  Settings
```

---

## Module definitions

| Module      | What it is | Primary key |
|-------------|-----------|-------------|
| Customer    | Master account record | `account_id` |
| Lead        | Sales opportunity | `lead_id` |
| Quote       | Estimate / proposal / sales document | `quote_id` |
| Job         | Scheduled unit of work | `job_id` |
| Work Order  | Field execution instructions for a Job | `work_order_id` |
| Project     | Larger scope with multiple jobs | `project_id` |
| Invoice     | Billing document | `invoice_id` |
| Agreement   | Recurring service plan | `agreement_id` |

---

## Context selector filtering

Every list page (Quotes, Work Orders, Invoices, Jobs, Leads, Customers) must
filter by the active context from the global selector:

```
Organization → Company → Location → Service Area
```

| Selector level | Filter applied |
|---|---|
| Organization | All records the user is authorized to see |
| Company | `company_id = selected` |
| Location | `location_id = selected` |
| Service Area | `service_area_id = selected` |

All four IDs must be present on every operational record:
`organization_id`, `company_id`, `location_id`, `service_area_id` (nullable).

---

## Record relationships & context surfaces

### Same record, multiple views — never duplicate

```
Quote
  ├── surfaces in: Quotes list (global)
  ├── surfaces in: Customer detail → Billing tab
  ├── surfaces in: Lead detail → Quote section      (if lead_id set)
  ├── surfaces in: Job detail → Quote/Invoice        (if job_id set)
  ├── surfaces in: Project detail → Financials       (if project_id set)
  └── surfaces in: Agreement detail → Billing        (if agreement_id set)

Invoice
  ├── surfaces in: Invoices list (global)
  ├── surfaces in: Customer detail → Billing tab
  ├── surfaces in: Job detail → Quote/Invoice        (if job_id set)
  ├── surfaces in: Project detail → Financials       (if project_id set)
  └── surfaces in: Agreement detail → Billing        (if agreement_id set)

Work Order
  ├── surfaces in: Work Orders list (global)
  ├── surfaces in: Customer detail → Jobs/WO tab     (if account_id set)
  └── surfaces in: Job detail → Work Order tab       (if job_id set)
```

### Link matrix

| Record | Can link to |
|---|---|
| Quote | `lead_id`, `job_id`, `project_id`, `agreement_id` |
| Invoice | `quote_id`, `job_id`, `project_id`, `agreement_id` |
| Work Order | `job_id` (required), `quote_id` (ref only), `invoice_id` (ref only) |
| Job | `project_id`, `agreement_id` |

---

## Detail page tabs — where related records appear

### Customer detail
Overview · Contacts · Properties · Equipment · Jobs · Leads · Agreements
· Photos & Files · Notes · Communication · **Billing** (Quotes + Invoices)

### Job detail *(Phase 2)*
Overview · Work Order · Quote · Invoice · Notes · Photos

### Project detail *(Phase 2)*
Overview · Jobs · Work Orders · Quotes · Invoices · Notes · Photos · Timeline

### Agreement detail *(Phase 4)*
Overview · Schedule · Billing (recurring invoices) · History · Notes

---

## Build order

### Phase 1 — Core CRM foundation
1. Customers ✓
2. Contacts (on Customer detail) ✓
3. Properties (on Customer detail) ✓
4. Leads (standalone list + pipeline)
5. Jobs (standalone list + detail)
6. Tasks (global + on Customer/Job detail)
7. Notes / Activity timeline

### Phase 2 — Jobs & Financials
8. Work Orders (after Jobs)
9. Projects
10. Quotes (after Leads + Jobs)
11. Invoices (after Quotes + Jobs + Projects)
12. Job detail with Work Order, Quote, Invoice tabs

### Phase 3 — Photos & Files
13. Supabase Storage integration
14. Photo galleries on Jobs, Projects, Customers

### Phase 4 — Agreements
15. Agreement templates
16. Customer agreements
17. Recurring invoice generation

### Phase 5 — Marketing
18. Email/SMS campaigns

### Phase 6 — Integrations & Reports
19. Payment processing
20. Advanced reporting

---

## What is NOT being built yet

- Full quote builder (line items, tax, PDF)
- Invoice payment processing
- Agreement auto-renewal billing
- Marketing campaign engine
- Reporting engine
- Any Phase 3+ features
