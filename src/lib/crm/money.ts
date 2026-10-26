export const USD = "usd";

export function dollarsToCents(dollars: number): number {
  if (!Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

export function formatCents(cents: number, currency = USD): string {
  const amount = (Number.isFinite(cents) ? cents : 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

export type BudgetMeter = {
  label: string;
  percent: number | null;
  barPercent: number;
  overageCents: number;
  tone: "none" | "normal" | "caution" | "full" | "over";
};

export function budgetMeter(
  budgetCents: number | null,
  actualCents: number
): BudgetMeter {
  if (budgetCents == null || budgetCents <= 0) {
    return {
      label: "No budget",
      percent: null,
      barPercent: 0,
      overageCents: 0,
      tone: "none",
    };
  }

  const percent = Math.round((actualCents / budgetCents) * 100);
  const overageCents = Math.max(0, actualCents - budgetCents);
  const tone =
    percent < 75 ? "normal" : percent < 100 ? "caution" : percent === 100 ? "full" : "over";

  return {
    label: `${percent}% of budget used`,
    percent,
    barPercent: Math.min(100, Math.max(0, percent)),
    overageCents,
    tone,
  };
}

export type InvoiceMoneyStatus =
  | "draft"
  | "issued"
  | "partial"
  | "paid"
  | "overdue"
  | "void";

export function invoiceStatusFromMoney(input: {
  status: InvoiceMoneyStatus;
  totalCents: number;
  allocatedCents: number;
  dueOn: string | null;
  today: string;
}): InvoiceMoneyStatus {
  if (input.status === "void" || input.status === "draft") return input.status;
  const outstanding = input.totalCents - input.allocatedCents;
  if (outstanding <= 0) return "paid";
  if (input.allocatedCents > 0) {
    if (input.dueOn && input.dueOn < input.today) return "overdue";
    return "partial";
  }
  if (input.dueOn && input.dueOn < input.today) return "overdue";
  return "issued";
}

export function grossMarginCents(input: {
  customerPriceCents: number;
  taxCents: number;
  actualCostCents: number;
  remainingBudgetCents: number | null;
}): { marginCents: number; forecastCostCents: number; laborNote: string } {
  const priceExTax = input.customerPriceCents - input.taxCents;
  const forecastCostCents =
    input.remainingBudgetCents == null
      ? input.actualCostCents
      : input.actualCostCents + Math.max(0, input.remainingBudgetCents);
  return {
    marginCents: priceExTax - forecastCostCents,
    forecastCostCents,
    laborNote:
      "Processing fees are excluded. Labor is included only when an internal rate is set. Sales tax is excluded.",
  };
}

export function sumUsd(
  rows: Array<{ cents: number; currency: string }>
): number {
  return rows.reduce(
    (sum, row) => (row.currency === USD ? sum + row.cents : sum),
    0
  );
}
