import { NextRequest, NextResponse } from "next/server";
import type { ParsedAddress, ValidationApiResponse } from "@/lib/address/types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_ADDRESS_VALIDATION_KEY;

  // If no key is configured, report "could not verify" so the UI degrades gracefully.
  if (!apiKey) {
    return NextResponse.json<ValidationApiResponse>({ hasCorrection: false, verified: false });
  }

  const body = (await request.json()) as ParsedAddress;

  const addressLines = [body.addressLine1, body.addressLine2].filter(Boolean);

  try {
    const res = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            addressLines,
            locality:            body.city,
            administrativeArea:  body.state,
            postalCode:          body.postalCode,
            regionCode:          body.country || "US",
          },
          enableUspsCass: false,
        }),
      },
    );

    if (!res.ok) {
      return NextResponse.json<ValidationApiResponse>({ hasCorrection: false, verified: false });
    }

    const data = await res.json();
    const result = data?.result;
    if (!result) return NextResponse.json<ValidationApiResponse>({ hasCorrection: false, verified: false });

    const verdict = result.verdict ?? {};
    const hasCorrection =
      verdict.hasReplacedComponents === true ||
      verdict.hasInferredComponents === true;

    if (!hasCorrection) {
      // Service ran successfully and the address is good as entered.
      return NextResponse.json<ValidationApiResponse>({ hasCorrection: false, verified: true });
    }

    // Build suggested address from API response
    const postal = result.address?.postalAddress;
    const geocode = result.geocode;

    if (!postal) {
      return NextResponse.json<ValidationApiResponse>({ hasCorrection: false, verified: true });
    }

    const lines: string[] = postal.addressLines ?? [];
    const suggested: ParsedAddress = {
      addressLine1:     lines[0] ?? body.addressLine1,
      addressLine2:     lines[1] ?? undefined,
      city:             postal.locality ?? body.city,
      state:            postal.administrativeArea ?? body.state,
      postalCode:       postal.postalCode ?? body.postalCode,
      country:          postal.regionCode ?? body.country,
      formattedAddress: [
        lines.join(", "),
        postal.locality,
        postal.administrativeArea,
        postal.postalCode,
      ].filter(Boolean).join(", "),
      latitude:         geocode?.location?.latitude,
      longitude:        geocode?.location?.longitude,
      placeId:          geocode?.placeId,
      validationStatus: "validated",
    };

    return NextResponse.json<ValidationApiResponse>({ hasCorrection: true, verified: true, suggestedAddress: suggested });
  } catch {
    // Network/API error — could not verify, but the address is still usable.
    return NextResponse.json<ValidationApiResponse>({ hasCorrection: false, verified: false });
  }
}
