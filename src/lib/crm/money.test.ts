import assert from "node:assert/strict";
import test from "node:test";
import {
  budgetMeter,
  dollarsToCents,
  grossMarginCents,
  invoiceStatusFromMoney,
  sumUsd,
} from "./money.ts";
import { canCloseWon, onboardingPercent } from "./stages.ts";
import { canAcceptIncludedRound, revisionMeter } from "./revisions.ts";

test("dollars convert to cents without float drift", () => {
  assert.equal(dollarsToCents(10.1), 1010);
  assert.equal(dollarsToCents(0.015), 2);
});

test("budget meter handles zero and overages", () => {
  assert.equal(budgetMeter(null, 500).tone, "none");
  assert.equal(budgetMeter(0, 500).percent, null);
  const over = budgetMeter(10000, 15000);
  assert.equal(over.percent, 150);
  assert.equal(over.barPercent, 100);
  assert.equal(over.overageCents, 5000);
  assert.equal(over.tone, "over");
  assert.equal(budgetMeter(10000, 7400).tone, "normal");
  assert.equal(budgetMeter(10000, 7500).tone, "caution");
  assert.equal(budgetMeter(10000, 10000).tone, "full");
});

test("invoice status follows allocations", () => {
  assert.equal(
    invoiceStatusFromMoney({
      status: "issued",
      totalCents: 1000,
      allocatedCents: 400,
      dueOn: "2099-01-01",
      today: "2026-01-01",
    }),
    "partial"
  );
  assert.equal(
    invoiceStatusFromMoney({
      status: "issued",
      totalCents: 1000,
      allocatedCents: 1000,
      dueOn: null,
      today: "2026-01-01",
    }),
    "paid"
  );
  assert.equal(
    invoiceStatusFromMoney({
      status: "void",
      totalCents: 1000,
      allocatedCents: 1000,
      dueOn: null,
      today: "2026-01-01",
    }),
    "void"
  );
});

test("margin excludes tax and does not treat a missing budget as zero cost", () => {
  const withBudget = grossMarginCents({
    customerPriceCents: 10000,
    taxCents: 800,
    actualCostCents: 2000,
    remainingBudgetCents: 3000,
  });
  assert.equal(withBudget.forecastCostCents, 5000);
  assert.equal(withBudget.marginCents, 4200);

  const noBudget = grossMarginCents({
    customerPriceCents: 10000,
    taxCents: 0,
    actualCostCents: 2000,
    remainingBudgetCents: null,
  });
  assert.equal(noBudget.forecastCostCents, 2000);
});

test("currency totals skip non-usd rows", () => {
  assert.equal(
    sumUsd([
      { cents: 100, currency: "usd" },
      { cents: 500, currency: "eur" },
    ]),
    100
  );
});

test("closed won requires acceptance, agreement, and deposit", () => {
  assert.equal(
    canCloseWon({
      hasAcceptance: true,
      agreementAccepted: true,
      depositSatisfied: false,
    }).ok,
    false
  );
  assert.equal(
    canCloseWon({
      hasAcceptance: true,
      agreementAccepted: true,
      depositSatisfied: true,
    }).ok,
    true
  );
});

test("onboarding percent ignores optional and not applicable items", () => {
  const result = onboardingPercent([
    { required: true, state: "complete" },
    { required: true, state: "not_applicable" },
    { required: false, state: "not_requested" },
    { required: true, state: "requested" },
  ]);
  assert.deepEqual(result, { complete: 1, total: 2, percent: 50 });
});

test("revision drafts do not consume rounds and the meter caps the bar", () => {
  assert.equal(
    canAcceptIncludedRound({
      state: "draft",
      kind: "included",
      roundsUsed: 0,
      allowance: 3,
    }).ok,
    false
  );
  const accepted = canAcceptIncludedRound({
    state: "submitted",
    kind: "included",
    roundsUsed: 2,
    allowance: 3,
  });
  assert.equal(accepted.ok, true);
  if (accepted.ok) assert.equal(accepted.nextUsed, 3);

  const blocked = canAcceptIncludedRound({
    state: "submitted",
    kind: "included",
    roundsUsed: 3,
    allowance: 3,
  });
  assert.equal(blocked.ok, false);

  const defect = canAcceptIncludedRound({
    state: "submitted",
    kind: "defect",
    roundsUsed: 3,
    allowance: 3,
  });
  assert.equal(defect.ok, true);
  if (defect.ok) assert.equal(defect.nextUsed, 3);

  const meter = revisionMeter(3, 3);
  assert.equal(meter.exhausted, true);
  assert.equal(meter.segments.filter(Boolean).length, 3);
});
