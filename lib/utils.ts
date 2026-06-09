import type {
  BookingStatus,
  ListingType,
  PropertyStatus,
  RentPeriod,
  TransactionStatus,
} from "@/types";

// ─── Rupiah Formatter ─────────────────────────────────────────────────────

export function formatRupiah(
  amount: number,
  options?: { showSymbol?: boolean },
): string {
  const { showSymbol = true } = options ?? {};
  const isWhole = Number.isInteger(amount);
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);

  return showSymbol ? `Rp ${formatted}` : formatted;
}

export function formatPrice(
  price: number,
  listingType: ListingType,
  rentPeriod?: RentPeriod | null,
): string {
  if (listingType === "rent" && rentPeriod) {
    return `${formatRupiah(price)} / ${rentPeriodLabel(rentPeriod)}`;
  }
  return formatRupiah(price);
}

// ─── Rent Period Labels ─────────────────────────────────────────────────────

const RENT_PERIOD_LABELS: Record<RentPeriod, string> = {
  day: "hari",
  month: "bulan",
  year: "tahun",
};

export function rentPeriodLabel(period: RentPeriod): string {
  return RENT_PERIOD_LABELS[period];
}

// ─── Listing Type Labels ────────────────────────────────────────────────────

const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  sale: "DIJUAL",
  rent: "DISEWAKAN",
};

export function listingTypeLabel(type: ListingType): string {
  return LISTING_TYPE_LABELS[type];
}

// ─── Date Formatter ─────────────────────────────────────────────────────────

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
  return `${Math.floor(diffDays / 365)} tahun lalu`;
}

// ─── Status Badge Config ────────────────────────────────────────────────────

export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface StatusBadgeConfig {
  label: string;
  variant: StatusBadgeVariant;
}

const PROPERTY_STATUS_CONFIG: Record<PropertyStatus, StatusBadgeConfig> = {
  available: { label: "Tersedia", variant: "success" },
  booked: { label: "Di-booking", variant: "warning" },
  sold: { label: "Terjual", variant: "neutral" },
  rented: { label: "Disewakan", variant: "info" },
  inactive: { label: "Nonaktif", variant: "danger" },
};

const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusBadgeConfig> = {
  pending: { label: "Menunggu", variant: "warning" },
  confirmed: { label: "Dikonfirmasi", variant: "info" },
  cancelled: { label: "Dibatalkan", variant: "danger" },
  expired: { label: "Kedaluwarsa", variant: "neutral" },
};

const TRANSACTION_STATUS_CONFIG: Record<TransactionStatus, StatusBadgeConfig> =
  {
    pending: { label: "Menunggu", variant: "warning" },
    confirmed: { label: "Dikonfirmasi", variant: "info" },
    cancelled: { label: "Dibatalkan", variant: "danger" },
    expired: { label: "Kedaluwarsa", variant: "neutral" },
    success: { label: "Selesai", variant: "success" },
    failed: { label: "Gagal", variant: "danger" },
  };

export function getPropertyStatusBadge(
  status: PropertyStatus,
): StatusBadgeConfig {
  return PROPERTY_STATUS_CONFIG[status];
}

export function getBookingStatusBadge(
  status: BookingStatus,
): StatusBadgeConfig {
  return BOOKING_STATUS_CONFIG[status];
}

export function getTransactionStatusBadge(
  status: TransactionStatus,
): StatusBadgeConfig {
  return TRANSACTION_STATUS_CONFIG[status];
}

export const STATUS_BADGE_CLASSES: Record<StatusBadgeVariant, string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  danger: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
};

// ─── NIK Formatter ────────────────────────────────────────────────────────────

export function formatNIK(nik: string): string {
  const digits = nik.replace(/\D/g, "").slice(0, 16);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 4)}.${digits.slice(4, 8)}.${digits.slice(8)}`;
  return `${digits.slice(0, 4)}.${digits.slice(4, 8)}.${digits.slice(8, 12)}.${digits.slice(12)}`;
}

export function parseNIK(formatted: string): string {
  return formatted.replace(/\D/g, "").slice(0, 16);
}

export function isValidNIK(nik: string): boolean {
  return /^\d{16}$/.test(nik.replace(/\D/g, ""));
}

// ─── Price Change Percentage ────────────────────────────────────────────────

export function calcPriceChangePercent(
  oldPrice: number,
  newPrice: number,
): number {
  if (oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

export function formatPriceChangePercent(
  oldPrice: number,
  newPrice: number,
): string {
  const pct = calcPriceChangePercent(oldPrice, newPrice);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

// ─── Property Status Messages (untuk CTA booking) ───────────────────────────

const BOOKING_DISABLED_MESSAGES: Partial<Record<PropertyStatus, string>> = {
  booked: "Properti ini sedang dalam proses booking.",
  sold: "Properti ini sudah terjual.",
  rented: "Properti ini sedang disewakan.",
  inactive: "Properti ini tidak aktif.",
};

export function getBookingDisabledMessage(
  status: PropertyStatus,
): string | null {
  return BOOKING_DISABLED_MESSAGES[status] ?? null;
}

// ─── Class Name Utility ─────────────────────────────────────────────────────

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
