import type { RentPeriod } from "@/types";

export function diffDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function diffMonths(start: Date, end: Date): number {
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

export function diffYears(start: Date, end: Date): number {
  let years = end.getFullYear() - start.getFullYear();
  if (
    end.getMonth() < start.getMonth() ||
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
  ) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function countPeriods(
  start: Date,
  end: Date,
  period: RentPeriod,
): number {
  switch (period) {
    case "day":
      return diffDays(start, end);
    case "month":
      return diffMonths(start, end);
    case "year":
      return diffYears(start, end);
  }
}

/** Replikasi logika fn_hitung_biaya_sewa di database */
export function calculateRentCost(
  startDate: Date | string,
  endDate: Date | string,
  pricePerPeriod: number,
  rentPeriod: RentPeriod,
  additionalFee = 0,
): number {
  const start =
    typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  if (end <= start) return 0;

  const periods = countPeriods(start, end, rentPeriod);
  if (periods === 0) return 0;

  return periods * pricePerPeriod + additionalFee;
}
