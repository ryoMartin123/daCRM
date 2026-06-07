"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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

// ─── Parse a Google PlaceResult into our address type ─────
function parsePlaceResult(place: google.maps.places.PlaceResult): ParsedAddress {
  const comps = place.address_components ?? [];

  const get = (type: string, short = false): string => {
    const c = comps.find(c => c.types.includes(type));
    return short ? (c?.short_name ?? "") : (c?.long_name ?? "");
  };

  const street = [get("street_number"), get("route")].filter(Boolean).join(" ");
  const city   =
    get("locality") ||
    get("sublocality_level_1") ||
    get("postal_town") ||
    get("administrative_area_level_2");

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

// ─── Trigger server-side validation ──────────────────────
async function callValidationApi(
  addr: ParsedAddress,
): Promise<ValidationApiResponse> {
  try {
    const res = await fetch("/api/validate-address", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(addr),
    });
    if (!res.ok) return { hasCorrection: false };
    return res.json() as Promise<ValidationApiResponse>;
  } catch {
    return { hasCorrection: false };
  }
}

// ─── Component ────────────────────────────────────────────
export function AddressAutocomplete({ value, onChange, placeholder, required, error }: Props) {
  const { loaded, loading: mapsLoading, unavailable } = useGoogleMaps();

  const inputRef        = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const listenerRef     = useRef<google.maps.MapsEventListener | null>(null);

  const [validating, setValidating] = useState(false);
  const [picked, setPicked]         = useState<boolean>(() => Boolean(value.city));
  // Set when the legacy Places Autocomplete widget can't be created (e.g. it's
  // not enabled for newer Google Cloud projects). We fall back to manual entry +
  // server-side validation instead of letting the error crash the form.
  const [widgetFailed, setWidgetFailed] = useState(false);
  const [dialog, setDialog]         = useState<{
    original:  ParsedAddress;
    suggested: ParsedAddress;
  } | null>(null);

  // Synchronous guard so a place pick + blur don't fire two validations at once.
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
      onChange({ ...addr, validationStatus: "validated" });
    } else {
      // Could not verify (no key / API error) — keep the address, flag it.
      onChange({ ...addr, validationStatus: "skipped" });
    }
  }, [onChange]);

  // Attach Autocomplete once Maps is loaded
  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;
    // Defensive: the Places library must actually be attached to the global.
    if (typeof google === "undefined" || !google.maps?.places?.Autocomplete) return;

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types:                ["address"],
        componentRestrictions: { country: ["us"] },
        fields:               ["address_components", "formatted_address", "geometry", "place_id"],
      });
    } catch {
      // The legacy Autocomplete class isn't available for this API project
      // (Google restricts it on newer Cloud projects). Degrade to manual entry
      // — the address still gets validated server-side via the Validation API.
      setWidgetFailed(true);
      return;
    }

    listenerRef.current = autocompleteRef.current.addListener(
      "place_changed",
      () => {
        const place = autocompleteRef.current!.getPlace();
        const parsed = parsePlaceResult(place);

        // Fallback: some API configs return no address_components — at least
        // capture the text so the form is never blocked.
        if (!parsed.addressLine1) {
          const text = place.formatted_address ?? inputRef.current?.value ?? "";
          if (!text) return;
          parsed.addressLine1     = text;
          parsed.formattedAddress = text;
        }

        setPicked(true);
        onChange(parsed);
        triggerValidation(parsed);
      },
    );

    return () => { listenerRef.current?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Manual typing — keep the address usable even without a Google selection.
  function handleManualInput(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.currentTarget.value;
    setPicked(false);
    onChange({
      ...EMPTY_ADDRESS,
      addressLine1:     text,
      formattedAddress: text,
      validationStatus: "unvalidated",
    });
  }

  // Validate a typed (non-Google-picked) address once the user leaves a field, so
  // manually-entered addresses still get checked + corrected by Google.
  function validateOnBlur() {
    if (value.addressLine1.trim() && value.validationStatus === "unvalidated") {
      triggerValidation(value);
    }
  }

  // Status icon next to the input
  const StatusIcon = () => {
    if (validating) return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--text-muted)" }} />;
    if (value.validationStatus === "validated" || value.validationStatus === "user_confirmed") {
      return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (value.validationStatus === "skipped") {
      return <AlertCircle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />;
    }
    if (value.addressLine1) {
      return <AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />;
    }
    return null;
  };

  // Manual mode = no usable Google autocomplete widget (no key / load failure /
  // the legacy widget being unavailable for this project).
  const manualMode = unavailable || widgetFailed;

  const inputPlaceholder = mapsLoading
    ? "Loading address search..."
    : manualMode
    ? "Enter address manually"
    : (placeholder ?? "Start typing an address…");

  const showBreakdown = picked || manualMode || Boolean(value.addressLine1);

  return (
    <div>
      {/* Main search input */}
      <div className="relative">
        <MapPin
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          ref={inputRef}
          type="text"
          defaultValue={value.formattedAddress || value.addressLine1}
          onChange={handleManualInput}
          onBlur={validateOnBlur}
          placeholder={inputPlaceholder}
          disabled={mapsLoading}
          autoComplete="off"
          className="w-full rounded-lg pl-9 pr-9 py-2 text-sm outline-none transition-all"
          style={{
            border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <StatusIcon />
        </div>
      </div>

      {/* Could-not-verify notice — non-blocking */}
      {value.validationStatus === "skipped" && (
        <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: "#b45309" }}>
          <AlertCircle className="w-3 h-3 shrink-0" />
          We couldn&apos;t verify this address automatically — you can continue anyway.
        </p>
      )}

      {/* Structured breakdown — shown after a selection or in manual mode */}
      {showBreakdown && (
        <div className="mt-2 grid grid-cols-6 gap-2">
          <div className="col-span-3">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Street
            </label>
            <input
              value={value.addressLine1}
              onChange={e => onChange({ ...value, addressLine1: e.target.value, validationStatus: "unvalidated" })}
              onBlur={validateOnBlur}
              className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface-2)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>Unit</label>
            <input
              value={value.addressLine2 ?? ""}
              onChange={e => onChange({ ...value, addressLine2: e.target.value || undefined })}
              placeholder="Apt, Unit…"
              className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface-2)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>City</label>
            <input
              value={value.city}
              onChange={e => onChange({ ...value, city: e.target.value, validationStatus: "unvalidated" })}
              onBlur={validateOnBlur}
              className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface-2)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>State</label>
            <input
              value={value.state}
              maxLength={2}
              onChange={e => onChange({ ...value, state: e.target.value.toUpperCase().slice(0, 2), validationStatus: "unvalidated" })}
              onBlur={validateOnBlur}
              className="w-full rounded-lg px-3 py-1.5 text-sm outline-none uppercase"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface-2)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>ZIP</label>
            <input
              value={value.postalCode}
              onChange={e => onChange({ ...value, postalCode: e.target.value, validationStatus: "unvalidated" })}
              onBlur={validateOnBlur}
              className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface-2)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>}

      {unavailable && (
        <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          Address autocomplete unavailable — add{" "}
          <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable.
        </p>
      )}
      {widgetFailed && !unavailable && (
        <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          Address suggestions are unavailable for this Google project — enter the
          address manually; it&apos;ll still be verified on save.
        </p>
      )}

      {/* Validation correction dialog */}
      {dialog && (
        <AddressValidationDialog
          original={dialog.original}
          suggested={dialog.suggested}
          onUseSuggested={() => {
            onChange({ ...dialog.suggested, validationStatus: "user_confirmed" });
            if (inputRef.current) inputRef.current.value = dialog.suggested.formattedAddress;
            setPicked(true);
            setDialog(null);
          }}
          onKeepOriginal={() => {
            onChange({ ...dialog.original, validationStatus: "user_confirmed" });
            setPicked(true);
            setDialog(null);
          }}
          onEdit={() => setDialog(null)}
        />
      )}
    </div>
  );
}

export { EMPTY_ADDRESS };
