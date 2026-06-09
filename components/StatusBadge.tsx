import type { BookingStatus, PropertyStatus, TransactionStatus } from "@/types";
import {
  cn,
  getBookingStatusBadge,
  getPropertyStatusBadge,
  getTransactionStatusBadge,
  listingTypeLabel,
  STATUS_BADGE_CLASSES,
  type StatusBadgeConfig,
} from "@/lib/utils";
import type { ListingType } from "@/types";

interface StatusBadgeProps {
  config: StatusBadgeConfig;
  className?: string;
}

export function StatusBadge({ config, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_BADGE_CLASSES[config.variant],
        className,
      )}
    >
      {config.label}
    </span>
  );
}

export function PropertyStatusBadge({
  status,
  className,
}: {
  status: PropertyStatus;
  className?: string;
}) {
  return (
    <StatusBadge config={getPropertyStatusBadge(status)} className={className} />
  );
}

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <StatusBadge config={getBookingStatusBadge(status)} className={className} />
  );
}

export function TransactionStatusBadge({
  status,
  className,
}: {
  status: TransactionStatus;
  className?: string;
}) {
  return (
    <StatusBadge
      config={getTransactionStatusBadge(status)}
      className={className}
    />
  );
}

export function ListingTypeBadge({
  type,
  className,
}: {
  type: ListingType;
  className?: string;
}) {
  const isSale = type === "sale";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        isSale
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-secondary/10 text-secondary border-secondary/20",
        className,
      )}
    >
      {listingTypeLabel(type)}
    </span>
  );
}
