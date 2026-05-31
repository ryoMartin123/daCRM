// Minimal Google Maps type declarations for address autocomplete.
// Covers only what daCRM uses. Install @types/google.maps for the full set.

declare namespace google.maps {
  namespace places {
    class Autocomplete {
      constructor(
        input: HTMLInputElement,
        opts?: AutocompleteOptions,
      );
      addListener(event: "place_changed", handler: () => void): MapsEventListener;
      getPlace(): PlaceResult;
    }

    interface AutocompleteOptions {
      types?: string[];
      componentRestrictions?: { country: string | string[] };
      fields?: string[];
    }

    interface PlaceResult {
      address_components?: AddressComponent[];
      formatted_address?: string;
      geometry?: PlaceGeometry;
      place_id?: string;
    }

    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface PlaceGeometry {
      location?: LatLng;
    }
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface MapsEventListener {
    remove(): void;
  }
}
