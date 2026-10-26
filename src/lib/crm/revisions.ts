export const DEFAULT_REVISION_ALLOWANCE = 3;

export const REVISION_STATES = [
  "draft",
  "submitted",
  "clarification_needed",
  "accepted",
  "in_progress",
  "delivered",
  "closed",
  "rejected",
  "withdrawn",
  "duplicate",
] as const;

export type RevisionState = (typeof REVISION_STATES)[number];

const CONSUMING = new Set<RevisionState>(["accepted", "in_progress", "delivered"]);

export function consumesAllowance(state: RevisionState, kind: "included" | "defect"): boolean {
  return kind === "included" && CONSUMING.has(state);
}

export function revisionMeter(used: number, allowance = DEFAULT_REVISION_ALLOWANCE) {
  const safeUsed = Math.max(0, used);
  const remaining = Math.max(0, allowance - safeUsed);
  const labels = [
    "Three remaining",
    "Two remaining",
    "One remaining",
    "Included rounds used",
  ];
  return {
    used: safeUsed,
    allowance,
    remaining,
    label: `Included revisions: ${Math.min(safeUsed, allowance)} of ${allowance} used`,
    detail: labels[Math.min(safeUsed, allowance)] ?? "Included rounds used",
    segments: Array.from({ length: allowance }, (_, index) => index < safeUsed),
    exhausted: safeUsed >= allowance,
  };
}

export function canAcceptIncludedRound(input: {
  state: RevisionState;
  kind: "included" | "defect";
  roundsUsed: number;
  allowance: number;
}): { ok: true; nextUsed: number } | { ok: false; reason: string } {
  if (input.state === "accepted" || input.state === "in_progress" || input.state === "delivered") {
    return { ok: true, nextUsed: input.roundsUsed };
  }
  if (input.state !== "submitted" && input.state !== "clarification_needed") {
    return { ok: false, reason: "Only a submitted round can be accepted." };
  }
  if (input.kind === "defect") {
    return { ok: true, nextUsed: input.roundsUsed };
  }
  if (input.roundsUsed >= input.allowance) {
    return {
      ok: false,
      reason: "Included revision rounds are used. Approve a change order before more work.",
    };
  }
  return { ok: true, nextUsed: input.roundsUsed + 1 };
}
