# Photos & Files — Architecture

CompanyCam-style media, owned by the **Account/Customer** as the master record.

## The rule: one file, many views — never duplicated

```
Account  ← always the owner (account_id, required)
  ├── Property      (property_id)
  ├── Lead          (lead_id)
  ├── Job           (job_id)
  ├── Project       (project_id)
  ├── Work Order    (work_order_id)
  ├── Agreement     (agreement_id)
  └── Equipment     (equipment_id)
```

A single `photos_files` row carries `account_id` plus any combination of the
optional FKs. Each view filters by the FK it cares about — the file is stored
once and appears everywhere it's linked.

| View | Query |
|---|---|
| Account → Photos | `account_id = :id` |
| Property → Photos | `property_id = :id` |
| Job → Photos | `job_id = :id` |
| Project → Photos | `project_id = :id` |
| Work Order → Photos | `work_order_id = :id` |
| Global Photos & Files | all, with filters |

A job photo whose job belongs to an account + property carries all three IDs,
so it shows in the account, property, AND job galleries automatically.

## Upload auto-fill (by where you upload from)

| Upload location | Auto-filled IDs |
|---|---|
| Account page    | `account_id` |
| Property page   | `account_id`, `property_id` |
| Job page        | `account_id`, `property_id`, `job_id` |
| Work Order page | `account_id`, `property_id`, `job_id`, `work_order_id` |
| Project page    | `account_id`, `project_id` |

The most-specific record sets the full chain so the file rolls up correctly.

## Record-tab scope toggle

On a record's Photos tab, a toggle controls how wide the gallery looks:

- **This Record** — only files linked to this exact job/project/work order
- **This Property** — all files for the property (across its jobs)
- **This Account** — every file for the account

## Filters (global Photos & Files page)

Account · Property · Job · Project · Work Order · Category · Uploaded By ·
Date · File Type. Categories come from **Settings → Photo Categories**.

## Storage

- Binary lives in a **private Supabase Storage bucket**; Postgres stores only
  metadata + the `storage_path` object key.
- `file_type`: `image | pdf | document | video | other`.

## Schema

See `supabase/migrations/0007_photos_files.sql`. Mirrored in
`lib/files/types.ts` (`PhotoFile`).

## Future

- Required-photo checklists (Work Order templates already define photo rules)
- Before/during/after customer-facing photo reports (PDF)
- AI tagging and equipment-plate detection
