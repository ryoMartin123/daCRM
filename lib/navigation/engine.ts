// ─── Navigation engine ────────────────────────────────────
// Stateless helpers the Navigation screen drives each position fix: advance the
// active step, compute distance/time remaining, detect arrival, and detect
// off-route. Tuned for the mock; the same contract works against real routes.

import { haversine, distanceToPath } from "./geo";
import type { LatLng, RouteData } from "./types";

export const ARRIVAL_RADIUS_M = 55;   // ~180 ft
export const OFF_ROUTE_M = 55;        // distance from the route line to count as off-route
export const STEP_ADVANCE_M = 28;     // within this of a step end → next step

// Monotonically advance the current step as the tech passes each turn.
export function advanceStep(pos: LatLng, route: RouteData, currentIndex: number): number {
  let i = Math.max(0, currentIndex);
  while (i < route.steps.length - 1 && haversine(pos, route.steps[i].end) < STEP_ADVANCE_M) i++;
  return i;
}

export function distanceToNextTurn(pos: LatLng, route: RouteData, stepIndex: number): number {
  const s = route.steps[stepIndex];
  return s ? haversine(pos, s.end) : 0;
}

// Distance + duration remaining from the current position to the destination.
export function remaining(pos: LatLng, route: RouteData, stepIndex: number): { distance: number; duration: number } {
  const steps = route.steps;
  if (stepIndex >= steps.length) return { distance: 0, duration: 0 };
  const cur = steps[stepIndex];
  let distance = haversine(pos, cur.end);
  let duration = cur.distanceMeters ? cur.durationSeconds * Math.min(1, distance / cur.distanceMeters) : 0;
  for (let i = stepIndex + 1; i < steps.length; i++) { distance += steps[i].distanceMeters; duration += steps[i].durationSeconds; }
  return { distance, duration };
}

export function isArrived(pos: LatLng, destination: LatLng): boolean {
  return haversine(pos, destination) <= ARRIVAL_RADIUS_M;
}

export function isOffRoute(pos: LatLng, routePath: LatLng[]): boolean {
  return distanceToPath(pos, routePath) > OFF_ROUTE_M;
}
