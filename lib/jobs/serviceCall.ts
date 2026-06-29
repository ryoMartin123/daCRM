// ─── Auto-creation orchestrators ──────────────────────────
// The UX rule: users never decide "job vs work order vs appointment." Creating a
// service call (or a return visit) spins up the right records behind the scenes:
//   service call  → Job + Work Order + Appointment
//   return visit  → new Work Order + Appointment under the SAME Job
// These compose the existing stores (createJob already auto-materializes a WO via
// the job type's policy); we just guarantee a WO + an Appointment exist.

import {
  createJob, createWorkOrder, getWorkOrder, getJob, materializeWorkOrderForJob,
  type Job, type WorkOrder, type NewJobInput,
} from "@/lib/jobs/data";
import { createAppointment, type Appointment } from "@/lib/appointments/data";

export interface CreateServiceCallInput extends NewJobInput {
  techIds?: string[];        // crew (primary first); falls back to assignedTo
  workOrderTitle?: string;   // optional WO title override (defaults to job title)
}

export function createServiceCall(input: CreateServiceCallInput): { job: Job; workOrder: WorkOrder; appointment: Appointment } {
  const techIds = input.techIds ?? (input.assignedTo ? [input.assignedTo] : []);
  // 1) Job — the container. createJob auto-materializes a WO per the type policy.
  const job = createJob({ ...input, assignedTo: techIds[0] ?? input.assignedTo });
  // 2) Guarantee a work order (every dispatched visit has one).
  let workOrder = getWorkOrder(job.id);
  if (!workOrder) workOrder = createWorkOrder({ jobId: job.id, title: input.workOrderTitle ?? input.title, checklist: [] });
  // 3) Appointment — the dispatch event.
  const appointment = createAppointment({
    jobId: job.id, workOrderId: workOrder.id, techIds,
    scheduledDate: input.scheduledDate, scheduledTime: input.scheduledTime, durationMinutes: input.durationMinutes,
  });
  return { job, workOrder, appointment };
}

export interface ReturnVisitInput {
  workOrderTitle: string;
  instructions?: string;
  checklist?: { label: string; required?: boolean }[];
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  techIds?: string[];
}
// Convert an EXISTING job into the appointment model when it's scheduled (e.g.
// dragged from the unscheduled queue onto the board): ensure a work order exists
// and create the dispatch appointment. Idempotent-ish — only call for a job that
// has no appointment yet (the queue suppresses jobs that already do).
export function scheduleExistingJob(
  jobId: string,
  sched: { scheduledDate?: string; scheduledTime?: string; durationMinutes?: number; techIds?: string[] },
): { workOrder?: WorkOrder; appointment?: Appointment } {
  const job = getJob(jobId);
  if (!job) return {};
  const workOrder = getWorkOrder(jobId) ?? materializeWorkOrderForJob(job)
    ?? createWorkOrder({ jobId, title: job.title, checklist: [] });
  const appointment = createAppointment({
    jobId, workOrderId: workOrder.id, techIds: sched.techIds,
    scheduledDate: sched.scheduledDate, scheduledTime: sched.scheduledTime, durationMinutes: sched.durationMinutes,
  });
  return { workOrder, appointment };
}

// A second (or third…) visit on the SAME job — new work order + appointment, with
// the first visit's history left intact.
export function addReturnVisit(jobId: string, input: ReturnVisitInput): { workOrder: WorkOrder; appointment: Appointment } {
  const workOrder = createWorkOrder({
    jobId, title: input.workOrderTitle, instructions: input.instructions, checklist: input.checklist ?? [],
  });
  const appointment = createAppointment({
    jobId, workOrderId: workOrder.id, techIds: input.techIds,
    scheduledDate: input.scheduledDate, scheduledTime: input.scheduledTime, durationMinutes: input.durationMinutes,
  });
  return { workOrder, appointment };
}
