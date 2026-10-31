export const ACCOUNT_CSV_COLUMNS = [
  "record_type",
  "name",
  "phone",
  "business_name",
  "email",
  "secondary_email",
  "notify_project_status",
  "notify_invoice_reminders",
  "billing_contact_name",
  "billing_business_name",
  "billing_email",
  "billing_country",
  "billing_address",
  "billing_street",
  "billing_line2",
  "billing_city",
  "billing_state",
  "billing_postal_code",
  "project_name",
  "project_stage",
  "project_created",
  "invoice_number",
  "invoice_kind",
  "invoice_status",
  "invoice_total",
  "currency",
] as const;

export function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: string[][]): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

export function csvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = row[index] ?? "";
    });
    return record;
  });
}
