// Address types — used by AddressAutocomplete and stored on customer/property records.
// Mirrors supabase/migrations/0006_address_fields.sql.

export type AddressValidationStatus =
  | "unvalidated"    // no validation attempted
  | "validated"      // Google confirmed exact match
  | "inferred"       // Google fixed minor issues automatically
  | "user_confirmed" // user reviewed and chose an option
  | "skipped";       // user proceeded without validation (API unavailable)

export interface ParsedAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;         // 2-letter abbreviation: "GA"
  postalCode: string;
  country: string;       // ISO 2-letter: "US"
  // Google data
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  validationStatus: AddressValidationStatus;
}

export const EMPTY_ADDRESS: ParsedAddress = {
  addressLine1: "",
  city: "",
  state: "GA",
  postalCode: "",
  country: "US",
  formattedAddress: "",
  validationStatus: "unvalidated",
};

// Shape returned by /api/validate-address
export interface ValidationApiResponse {
  hasCorrection: boolean;
  suggestedAddress?: ParsedAddress;
  // true  = the validation service actually checked the address
  // false = no key / API error — could not verify (user may continue anyway)
  verified?: boolean;
}
