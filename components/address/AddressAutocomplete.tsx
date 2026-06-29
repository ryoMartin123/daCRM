"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, CheckCircle, AlertCircle, Loader2, Pencil } from "lucide-react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { AddressValidationDialog } from "./AddressValidationDialog";
import type { ParsedAddress, ValidationApiResponse } from "@/lib/address/types";
import { EMPTY_ADDRESS } from "@/lib/address/types";

export type { ParsedAddress };

interface Props {
  value:       ParsedAddress;
  onChange:    (address: ParsedAddress) => void;
  placeholder?: string;
  required?:   boolean;
  error?:      string | null;
}

// ─── Parse a Google PlaceResult / GeocoderResult into our address type ─────
function parsePlaceResult(place: google.maps.places.PlaceResult): ParsedAddress {
  const comps = place.address_components ?? [];
  const get = (type: string, short = false): string => {
    const c = comps.find(c => c.types.includes(type));
    return short ? (c?.short_name ?? "") : (c?.long_name ?? "");
  };
  const street = [get("street_number"), get("route")].filter(Boolean).join(" ");
  const city = get("locality") || get("sublocality_level_1") || get("postal_town") || get("administrative_area_level_2");
  return {
    addressLine1:     street,
    addressLine2:     get("subpremise") || undefined,
    city,
    state:            get("administrative_area_level_1", true),
    postalCode:       get("postal_code"),
    country:          get("country", true) || "US",
    formattedAddress: place.formatted_address ?? street,
    latitude:         place.geometry?.location?.lat(),
    longitude:        place.geometry?.location?.lng(),
    placeId:          place.place_id,
    validationStatus: "unvalidated",
  };
}

async function callValidationApi(addr: ParsedAddress): Promise<ValidationApiResponse> {
  try {
    const res = await fetch("/api/validate-address", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addr) });
    if (!res.ok) return { hasCorrection: false };
    return res.json() as Promise<ValidationApiResponse>;
  } catch { return { hasCorrection: false }; }
}

// ─── Component ────────────────────────────────────────────
export function AddressAutocomplete({ value, onChange, placeholder, required, error }: Props) {
  const { loaded, loading: mapsLoading, unavailable } = useGoogleMaps();

  const inputRef        = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const listenerRef     = useRef<google.maps.MapsEventListener | null>(null);

  const [validating, setValidating]       = useState(false);
  const [widgetFailed, setWidgetFailed]   = useState(false);
  const [manualOverride, setManualOverride] = useState(false);   // user chose to hand-edit a verified address
  const [dialog, setDialog]               = useState<{ original: ParsedAddress; suggested: ParsedAddress } | null>(null);
  const inFlight = useRef(false);

  const triggerValidation = useCallback(async (addr: ParsedAddress) => {
    if (inFlight.current || !addr.addressLine1.trim()) return;
    inFlight.current = true;
    setValidating(true);
    const result = await callValidationApi(addr);
    setValidating(false);
    inFlight.current = false;

    if (result.hasCorrection && result.suggestedAddress) {
      setDialog({ original: addr, suggested: result.suggestedAddress });
    } else if (result.verified) {
      const std = result.standardizedAddress;
      onChange({
        ...addr,
        addressLine1: addr.addressLine1 || std?.addressLine1 || "",
        city:         addr.city       || std?.city       || "",
        state:        addr.state      || std?.state      || "",
        postalCode:   addr.postalCode || std?.postalCode || "",
        latitude:     addr.latitude   ?? std?.latitude,
        longitude:    addr.longitude  ?? std?.longitude,
        validationStatus: "validated",
      });
    } else {
      // Couldn't verify — unlock the fields so the address can be completed manually.
      onChange({ ...addr, validationStatus: "skipped" });
    }
  }, [onChange]);

  // Attach the Autocomplete widget once Maps is loaded.
  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;
    if (typeof google === "undefined" || !google.maps?.places?.Autocomplete) return;

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"], componentRestrictions: { country: ["us"] },
        fields: ["address_components", "formatted_address", "geometry", "place_id"],
      });
    } catch { setWidgetFailed(true); return; }

    const apply = (parsed: ParsedAddress) => {
      if (!parsed.addressLine1) {
        const t = parsed.formattedAddress || inputRef.current?.value || "";
        if (!t) return;
        parsed = { ...parsed, addressLine1: t, formattedAddress: t };
      }
      setManualOverride(false);
      if (inputRef.current && parsed.formattedAddress) inputRef.current.value = parsed.formattedAddress;
      onChange(parsed);
      triggerValidation(parsed);
    };

    listenerRef.current = autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      const text = place.formatted_address || inputRef.current?.value || "";
      // ALWAYS resolve via the Geocoder — the Autocomplete widget frequently
      // returns partial address_components (e.g. just the street number), which
      // is what left City/ZIP empty. The geocoder gives complete, authoritative parts.
      if (typeof google !== "undefined" && google.maps?.Geocoder && (place.place_id || text)) {
        const req: google.maps.GeocoderRequest = place.place_id ? { placeId: place.place_id } : { address: text };
        new google.maps.Geocoder().geocode(req, (res, status) => {
          apply(status === "OK" && res?.[0] ? parsePlaceResult(res[0] as unknown as google.maps.places.PlaceResult) : parsePlaceResult(place));
        });
        return;
      }
      apply(parsePlaceResult(place));
    });

    return () => { listenerRef.current?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Typing in the search box resets to a single unvalidated line.
  function handleManualInput(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.currentTarget.value;
    setManualOverride(false);
    onChange({ ...EMPTY_ADDRESS, addressLine1: text, formattedAddress: text, validationStatus: "unvalidated" });
  }
  function validateOnBlur() {
    if (value.addressLine1.trim() && value.validationStatus === "unvalidated") triggerValidation(value);
  }

  const manualMode = unavailable || widgetFailed;
  const isVerified = value.validationStatus === "validated" || value.validationStatus === "user_confirmed";
  // Breakdown is locked (read-only) once verified — you change it by searching
  // again. It's editable only when we couldn't verify, in manual mode, or the
  // user explicitly chose to hand-edit.
  const editable = manualOverride || manualMode || value.validationStatus === "skipped";
  // Only show the structured fields when they're editable — i.e. a verified
  // address (picked from the dropdown / validated) hides them; the address is
  // pulled from the value behind the scenes. Manual/unverifiable entry shows them.
  const showBreakdown = editable;

  const cellStyle = (locked: boolean): React.CSSProperties => ({
    border: "1px solid var(--border)",
    backgroundColor: locked ? "var(--bg-input)" : "var(--bg-surface-2)",
    color: locked ? "var(--text-muted)" : "var(--text-primary)",
    cursor: locked ? "default" : "text",
  });

  const inputPlaceholder = mapsLoading ? "Loading address search…" : manualMode ? "Enter address manually" : (placeholder ?? "Start typing an address…");

  return (
    <div>
      {/* Search input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
        <input
          ref={inputRef} type="text" defaultValue={value.formattedAddress || value.addressLine1}
          onChange={handleManualInput} onBlur={validateOnBlur} placeholder={inputPlaceholder} disabled={mapsLoading} autoComplete="off"
          className="w-full rounded-lg pl-9 pr-9 py-2 text-sm outline-none transition-all"
          style={{ border: `1px solid ${error ? "#ef4444" : "var(--border)"}`, backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }} />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--text-muted)" }} />
            : isVerified ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            : value.validationStatus === "skipped" ? <AlertCircle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
            : value.addressLine1 ? <AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} /> : null}
        </div>
      </div>

      {/* Status line under the search */}
      {validating ? (
        <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}><Loader2 className="w-3 h-3 animate-spin" /> Checking address…</p>
      ) : isVerified && !editable ? (
        <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: "#16a34a" }}>
          <CheckCircle className="w-3 h-3 shrink-0" /> Verified address ·{" "}
          <button type="button" onClick={() => setManualOverride(true)} className="inline-flex items-center gap-0.5 font-semibold" style={{ color: "var(--text-secondary)" }}><Pencil className="w-3 h-3" /> Edit manually</button>
        </p>
      ) : value.validationStatus === "skipped" ? (
        <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: "#b45309" }}>
          <AlertCircle className="w-3 h-3 shrink-0" /> Couldn&apos;t verify — complete the address below.
        </p>
      ) : null}

      {/* Structured breakdown — read-only until verification fails or user edits */}
      {showBreakdown && (
        <div className="mt-2 grid grid-cols-6 gap-2">
          <Part span={3} label="Street" value={value.addressLine1} readOnly={!editable} style={cellStyle(!editable)}
            onChange={v => onChange({ ...value, addressLine1: v, validationStatus: "unvalidated" })} onBlur={validateOnBlur} />
          <Part span={1} label="Unit" value={value.addressLine2 ?? ""} placeholder="Apt…" readOnly={!editable} style={cellStyle(!editable)}
            onChange={v => onChange({ ...value, addressLine2: v || undefined })} />
          <Part span={2} label="City" value={value.city} readOnly={!editable} style={cellStyle(!editable)}
            onChange={v => onChange({ ...value, city: v, validationStatus: "unvalidated" })} onBlur={validateOnBlur} />
          <Part span={1} label="State" value={value.state} maxLength={2} upper readOnly={!editable} style={cellStyle(!editable)}
            onChange={v => onChange({ ...value, state: v.toUpperCase().slice(0, 2), validationStatus: "unvalidated" })} onBlur={validateOnBlur} />
          <Part span={2} label="ZIP" value={value.postalCode} readOnly={!editable} style={cellStyle(!editable)}
            onChange={v => onChange({ ...value, postalCode: v, validationStatus: "unvalidated" })} onBlur={validateOnBlur} />
        </div>
      )}

      {error && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>}
      {unavailable && <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>Address autocomplete unavailable — add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable.</p>}
      {widgetFailed && !unavailable && <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>Address suggestions are unavailable for this Google project — enter the address manually; it&apos;ll still be verified on save.</p>}

      {dialog && (
        <AddressValidationDialog
          original={dialog.original} suggested={dialog.suggested}
          onUseSuggested={() => { onChange({ ...dialog.suggested, validationStatus: "user_confirmed" }); if (inputRef.current) inputRef.current.value = dialog.suggested.formattedAddress; setManualOverride(false); setDialog(null); }}
          onKeepOriginal={() => { onChange({ ...dialog.original, validationStatus: "user_confirmed" }); setManualOverride(false); setDialog(null); }}
          onEdit={() => { setManualOverride(true); setDialog(null); }} />
      )}
    </div>
  );
}

function Part({ span, label, value, onChange, onBlur, readOnly, style, placeholder, maxLength, upper }: {
  span: number; label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  readOnly?: boolean; style: React.CSSProperties; placeholder?: string; maxLength?: number; upper?: boolean;
}) {
  return (
    <div style={{ gridColumn: `span ${span} / span ${span}` }}>
      <label className="block text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input
        value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} readOnly={readOnly}
        placeholder={placeholder} maxLength={maxLength}
        className={`w-full rounded-lg px-3 py-1.5 text-sm outline-none ${upper ? "uppercase" : ""}`} style={style} />
    </div>
  );
}

export { EMPTY_ADDRESS };
