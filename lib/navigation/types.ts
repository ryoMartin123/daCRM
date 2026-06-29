// ─── Navigation Mode — shared types ───────────────────────
// In-app turn-by-turn for technicians. Route data is normalized server-side
// (lib backend → /api/routes/compute) so the same shape works whether it came
// from the Google Routes API or the mock generator, and so a future native
// navigation layer can consume the same contract.

export type Maneuver =
  | "depart" | "arrive" | "straight"
  | "turn-left" | "turn-right" | "turn-slight-left" | "turn-slight-right"
  | "turn-sharp-left" | "turn-sharp-right" | "uturn"
  | "ramp-left" | "ramp-right" | "fork-left" | "fork-right" | "merge" | "roundabout";

export interface LatLng { lat: number; lng: number }

export interface RouteStep {
  instruction: string;
  maneuver: Maneuver;
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;          // encoded polyline for this step
  start: LatLng;
  end: LatLng;
  streetName?: string;
}

export interface RouteData {
  polyline: string;                    // full encoded polyline
  distanceMeters: number;
  durationSeconds: number;
  durationInTrafficSeconds?: number;
  etaIso: string;                      // computed arrival timestamp
  steps: RouteStep[];
  bounds?: { north: number; south: number; east: number; west: number };
}

export interface ComputeRouteRequest {
  origin: LatLng;
  destination: { lat?: number; lng?: number; address?: string };
  jobId?: string;
  technicianId?: string;
  options?: { avoidTolls?: boolean; avoidHighways?: boolean };
}

export interface RouteSession {
  id: string;
  technicianId: string;
  jobId: string;
  status: "active" | "completed" | "canceled";
  originLat: number;
  originLng: number;
  destinationAddress?: string;
  destinationLat: number;
  destinationLng: number;
  startedAt: string;
  completedAt?: string;
  lastLat?: number;
  lastLng?: number;
  lastLocationAt?: string;
  routePolyline: string;
  distanceRemaining: number;
  durationRemaining: number;
  eta: string;
  currentStepIndex: number;
  offRoute: boolean;
  arrivalDetected: boolean;
}
