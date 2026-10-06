import type { DomainState } from "./domain";

export function registrationTotals(state: DomainState, eventId: string) {
  const registrations = state.registrations.filter(r => r.event_id === eventId);
  const allocations = new Set(state.allocations.map(a => a.registration_id));
  return {
    total: registrations.length,
    verified: registrations.filter(r => r.payment_status === "PAYMENT_VERIFIED").length,
    pending: registrations.filter(r => r.payment_status === "PENDING_PAYMENT").length,
    allocated: registrations.filter(r => allocations.has(r.registration_id)).length,
    unallocated: registrations.filter(r => r.payment_status === "PAYMENT_VERIFIED" && !allocations.has(r.registration_id)).length,
  };
}
