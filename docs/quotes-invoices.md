# Quotes & Invoices — Architecture

## Where financial records live

```
Customer/Account  ← always the master owner of every quote and invoice
  ├── Lead        ← a sales opportunity; may produce a quote
  ├── Project     ← larger scope; may have multiple quotes and invoices
  ├── Job         ← scheduled work; may have one quote and one invoice
  ├── Agreement   ← recurring plan; generates renewal invoices
  └── Work Order  ← field execution instructions; references but does not own
```

A quote or invoice always has an `account_id`. The other FKs
(`property_id`, `lead_id`, `project_id`, `job_id`, `agreement_id`) are
optional and additive — they allow the **same record** to appear in multiple
context views without copying data.

---

## The rule: one record, many views

Do **not** duplicate a quote or invoice. Instead, filter by the relevant FK
in each view:

| View | Filter |
|---|---|
| Customer → Billing tab | `account_id = :customer_id` |
| Project detail → Financials | `project_id = :project_id` |
| Job detail → Quote/Invoice | `job_id = :job_id` |
| Agreement detail → Billing | `agreement_id = :agreement_id` |
| Lead detail | `lead_id = :lead_id` |

---

## Quotes

**Status flow:**
```
draft → sent → approved → converted (to invoice)
                        → declined
              expired (if expires_at passes without action)
```

**Key fields:**
- `quote_number` — human-readable (e.g. Q-2026-0042)
- `title` — short description
- `status` — draft | sent | approved | declined | expired | converted
- `subtotal`, `tax`, `total`
- `expires_at` — optional expiry date
- `approved_at` — set when customer approves

---

## Invoices

**Status flow:**
```
draft → sent → partial (partial payment received)
                      → paid
            → overdue (if due_date passes unpaid)
void (can be voided at any status)
```

**Key fields:**
- `invoice_number` — human-readable (e.g. INV-2026-0108)
- `title`
- `status` — draft | sent | partial | paid | overdue | void
- `subtotal`, `tax`, `total`, `balance_due`
- `due_date`
- `paid_at`
- `quote_id` — nullable; set if invoice was converted from a quote

---

## UI surfaces

### Customer detail → Billing tab
Shows all quotes and invoices for the account in two tables:
- Quotes table: quote #, title, linked to (job/project/lead), status, total, expires
- Invoices table: invoice #, title, linked to, status, total, balance due, due date

### Project detail → Financials tab *(Phase 2)*
Filtered to `project_id`. Shows project-level quotes and all invoices
generated from project work.

### Job detail → Quote / Invoice *(Phase 2)*
Filtered to `job_id`. Typically one quote and one invoice per job.

### Agreement detail → Billing *(Phase 4)*
Filtered to `agreement_id`. Shows recurring invoices and renewal billing
history.

### Work Order
References a quote or invoice (read-only link) but does not own the record.
Work orders do not appear as a filter target on quotes or invoices.

---

## What this is NOT

- Not a full accounting system — no GL, journals, or double-entry
- Not a payment processor — integrations come in Phase 6
- Quotes do not live only on leads — any context can generate a quote
- Invoices are not duplicated across views — always filter, never copy

---

## Build order

1. *(Now)* Schema + TypeScript types — done in this pass
2. *(Phase 2)* Quote builder UI: line items, tax, preview, PDF export
3. *(Phase 2)* Invoice creation: from quote or manual
4. *(Phase 4)* Agreement renewal invoicing
5. *(Phase 6)* Payment processing integration (Stripe / etc.)
