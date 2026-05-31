// Custom Widget — data model for the widget builder.
// A custom widget is defined entirely through point-and-click config.
// No raw SQL. Evaluated against existing mock data (Supabase later).

export type DataSourceKey =
  | "customers" | "leads" | "jobs" | "work_orders" | "quotes"
  | "invoices" | "payments" | "agreements" | "tasks" | "photos"
  | "properties" | "equipment";

export type FieldType = "string" | "number" | "enum" | "date";

export interface FieldDef {
  key:      string;
  label:    string;
  type:     FieldType;
  options?: string[];   // for enum fields
}

export type FilterOperator = "is" | "is_not" | "gt" | "lt" | "contains";

export interface WidgetFilter {
  id:       string;
  field:    string;
  operator: FilterOperator;
  value:    string;
}

export type CalculationType =
  | "count" | "sum" | "average" | "percentage" | "group_by" | "trend" | "list";

export interface Calculation {
  type:  CalculationType;
  field?: string;   // required for sum / average / group_by
}

export type VisualizationType =
  | "number_card" | "list" | "table" | "bar" | "line"
  | "pie" | "funnel" | "progress" | "leaderboard";

export type ContextBehavior = "follow" | "org" | "company" | "location" | "user";

export type WidgetRole =
  | "admin" | "manager" | "csr" | "sales" | "technician" | "accounting" | "marketing";

export type WidgetStatus = "draft" | "published" | "disabled" | "archived";

export interface CustomWidget {
  id:            string;
  name:          string;
  description:   string;
  dataSource:    DataSourceKey;
  filters:       WidgetFilter[];
  calculation:   Calculation;
  visualization: VisualizationType;
  context:       ContextBehavior;
  visibility:    WidgetRole[];
  status:        WidgetStatus;
  createdAt:     string;
  updatedAt:     string;
}
