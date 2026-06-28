// Photos & Files — types. Mirrors supabase/migrations/0007_photos_files.sql.
// Account is the master owner; optional FKs surface the same file in many views.

export type FileType = "image" | "pdf" | "document" | "video" | "other";
export type PhotoPhase = "before" | "during" | "after";

export interface PhotoFile {
  id:             string;
  organizationId: string;
  companyId:      string;
  locationId:     string;
  serviceAreaId?: string;

  // Master owner
  accountId:      string;

  // Optional context links — the same file surfaces in any linked record's view
  propertyId?:    string;
  leadId?:        string;
  jobId?:         string;
  projectId?:     string;
  workOrderId?:   string;
  agreementId?:   string;
  quoteId?:       string;
  invoiceId?:     string;
  equipmentId?:   string;

  categoryKey:    string;   // links to a photo category (Settings → Photo Categories)
  phase?:         PhotoPhase; // before / during / after (progress galleries + reports)
  fileName:       string;
  fileType:       FileType;
  storagePath:    string;
  notes?:         string;
  tags:           string[];

  // Field-capture geotag (CompanyCam-style) — lat/lng where the photo was taken.
  lat?:           number;
  lng?:           number;

  uploadedBy:     string;
  uploadedAt:     string;   // ISO date for sorting
  displayDate:    string;   // human-readable

  // Denormalized for display
  accountName?:   string;
  // Transient, session-only object URL for a just-captured photo (not persisted).
  previewUrl?:    string;
}

// A filter that matches a file by ALL provided linked IDs (AND).
export interface FileScope {
  accountId?:   string;
  propertyId?:  string;
  leadId?:      string;
  jobId?:       string;
  projectId?:   string;
  workOrderId?: string;
  agreementId?: string;
  quoteId?:     string;
  invoiceId?:   string;
  equipmentId?: string;
}

// The related-record badge a file shows, derived from its most specific link.
export type FileLinkKind =
  | "work_order" | "job" | "project" | "agreement"
  | "quote" | "invoice" | "property" | "account";
