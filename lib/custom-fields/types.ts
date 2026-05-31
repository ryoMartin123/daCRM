// Custom Fields — type definitions.
// Custom fields extend any record type with organization-specific data.
// These will eventually appear on create/edit forms and detail pages.

export type RecordType =
  | "customers"
  | "contacts"
  | "properties"
  | "leads"
  | "jobs"
  | "projects"
  | "work_orders"
  | "equipment"
  | "agreements"
  | "quotes"
  | "invoices";

export type FieldType =
  | "text"
  | "long_text"
  | "number"
  | "currency"
  | "dropdown"
  | "multi_select"
  | "date"
  | "checkbox"
  | "phone"
  | "email"
  | "url";

export interface CustomField {
  id:         string;
  recordType: RecordType;
  label:      string;
  key:        string;        // snake_case, used as the field identifier in DB
  fieldType:  FieldType;
  required:   boolean;
  visible:    boolean;
  options?:   string[];      // only for dropdown / multi_select
  sortOrder:  number;
  createdAt:  string;
}

// ─── Display helpers ──────────────────────────────────────

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  customers:   "Customers",
  contacts:    "Contacts",
  properties:  "Properties",
  leads:       "Leads",
  jobs:        "Jobs",
  projects:    "Projects",
  work_orders: "Work Orders",
  equipment:   "Equipment",
  agreements:  "Agreements",
  quotes:      "Quotes",
  invoices:    "Invoices",
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text:         "Text",
  long_text:    "Long Text",
  number:       "Number",
  currency:     "Currency",
  dropdown:     "Dropdown",
  multi_select: "Multi-Select",
  date:         "Date",
  checkbox:     "Checkbox",
  phone:        "Phone",
  email:        "Email",
  url:          "URL",
};

// Types that require an options list
export const OPTION_FIELD_TYPES: FieldType[] = ["dropdown", "multi_select"];

export const FIELD_TYPE_BADGE: Record<FieldType, { bg: string; color: string }> = {
  text:         { bg: "#f3f4f6",  color: "#6b7280" },
  long_text:    { bg: "#f3f4f6",  color: "#6b7280" },
  number:       { bg: "#dbeafe",  color: "#1e40af" },
  currency:     { bg: "#d1fae5",  color: "#065f46" },
  dropdown:     { bg: "#ede9fe",  color: "#5b21b6" },
  multi_select: { bg: "#fae8ff",  color: "#86198f" },
  date:         { bg: "#fef3c7",  color: "#92400e" },
  checkbox:     { bg: "#e0f2fe",  color: "#0369a1" },
  phone:        { bg: "#f0fdf4",  color: "#15803d" },
  email:        { bg: "#fff7ed",  color: "#9a3412" },
  url:          { bg: "#f1f5f9",  color: "#334155" },
};
