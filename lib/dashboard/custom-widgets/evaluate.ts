// Custom Widget evaluator — computes a live preview result from a widget
// definition using the normalized mock rows. Pure, no side effects.

import { getRows, SOURCES_WITH_DATA, SOURCE_FIELDS } from "./registry";
import type { CustomWidget, WidgetFilter } from "./types";

export type PreviewResult =
  | { kind: "unavailable"; reason: string }
  | { kind: "number"; value: number; isCurrency: boolean; label: string }
  | { kind: "list";   items: string[] }
  | { kind: "groups"; rows: { label: string; value: number }[]; isCurrency: boolean };

type Row = Record<string, string | number>;

// ─── Filter application ───────────────────────────────────
function applyFilters(rows: Row[], filters: WidgetFilter[]): Row[] {
  return rows.filter(row =>
    filters.every(f => {
      if (!f.field || f.value === "") return true;
      const cell = row[f.field];
      const cellStr = String(cell ?? "").toLowerCase();
      const valStr  = f.value.toLowerCase();
      const cellNum = Number(cell);
      const valNum  = Number(f.value);
      switch (f.operator) {
        case "is":       return cellStr === valStr;
        case "is_not":   return cellStr !== valStr;
        case "contains": return cellStr.includes(valStr);
        case "gt":       return !isNaN(cellNum) && !isNaN(valNum) && cellNum > valNum;
        case "lt":       return !isNaN(cellNum) && !isNaN(valNum) && cellNum < valNum;
        default:         return true;
      }
    })
  );
}

const isCurrencyField = (f?: string) =>
  f === "total" || f === "balanceDue" || f === "amount";

// ─── Main evaluator ───────────────────────────────────────
export function evaluateWidget(w: CustomWidget): PreviewResult {
  if (!SOURCES_WITH_DATA.includes(w.dataSource)) {
    return { kind: "unavailable", reason: "Sample data for this source isn't connected yet — preview will work once Supabase is live." };
  }

  const rows = applyFilters(getRows(w.dataSource), w.filters);
  const calc = w.calculation;

  // LIST
  if (calc.type === "list") {
    return { kind: "list", items: rows.slice(0, 8).map(r => String(r._label ?? "—")) };
  }

  // COUNT
  if (calc.type === "count") {
    return { kind: "number", value: rows.length, isCurrency: false, label: "Total" };
  }

  // SUM / AVERAGE — need a numeric field
  if (calc.type === "sum" || calc.type === "average") {
    if (!calc.field) return { kind: "unavailable", reason: "Choose a numeric field to calculate." };
    const nums = rows.map(r => Number(r[calc.field!])).filter(n => !isNaN(n));
    if (nums.length === 0) return { kind: "number", value: 0, isCurrency: isCurrencyField(calc.field), label: "No data" };
    const total = nums.reduce((a, b) => a + b, 0);
    const value = calc.type === "sum" ? total : Math.round(total / nums.length);
    return { kind: "number", value, isCurrency: isCurrencyField(calc.field), label: calc.type === "sum" ? "Sum" : "Average" };
  }

  // PERCENTAGE — % of records matching filters vs all records
  if (calc.type === "percentage") {
    const all = getRows(w.dataSource).length;
    const pct = all > 0 ? Math.round((rows.length / all) * 100) : 0;
    return { kind: "number", value: pct, isCurrency: false, label: "% of total" };
  }

  // GROUP BY / TREND — count per value of the chosen field
  if (calc.type === "group_by" || calc.type === "trend") {
    const field = calc.field ?? SOURCE_FIELDS[w.dataSource][0]?.key;
    if (!field) return { kind: "unavailable", reason: "Choose a field to group by." };
    const counts = new Map<string, number>();
    rows.forEach(r => {
      const key = String(r[field] ?? "—");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const groupRows = Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    return { kind: "groups", rows: groupRows, isCurrency: false };
  }

  return { kind: "unavailable", reason: "Unsupported calculation." };
}
