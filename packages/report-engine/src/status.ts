import type { ReportStatus } from '@guardianes/contracts';

const TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  draft: ['queued_offline', 'submitted', 'rejected'],
  queued_offline: ['submitted', 'rejected'],
  submitted: ['geo_processed', 'under_review', 'needs_info', 'rejected'],
  geo_processed: ['under_review', 'needs_info', 'accepted', 'rejected'],
  under_review: ['needs_info', 'accepted', 'rejected', 'alerted'],
  needs_info: ['under_review', 'rejected', 'submitted'],
  accepted: ['alerted', 'under_review'],
  rejected: [],
  alerted: [],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: ReportStatus, to: ReportStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid report status transition: ${from} → ${to}`);
  }
}

export function listAllowedTransitions(from: ReportStatus): readonly ReportStatus[] {
  return TRANSITIONS[from];
}
