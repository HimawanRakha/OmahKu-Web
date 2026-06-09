import { cn } from "@/lib/utils";
import type { BookingStatus, TransactionStatus } from "@/types";
import { Check } from "lucide-react";

interface Props {
  bookingStatus?: BookingStatus;
  transactionStatus?: TransactionStatus;
}

const STEPS = [
  { key: "booking", label: "Booking dibuat" },
  { key: "confirmed", label: "Booking dikonfirmasi" },
  { key: "transaction", label: "Transaksi dibuat" },
  { key: "done", label: "Transaksi selesai" },
];

function getStepIndex(bookingStatus?: BookingStatus, transactionStatus?: TransactionStatus): number {
  if (transactionStatus === "success" || transactionStatus === "failed") return 3;
  if (transactionStatus === "pending") return 2;
  if (bookingStatus === "confirmed") return 1;
  return 0;
}

export function TransactionTimeline({ bookingStatus, transactionStatus }: Props) {
  const current = getStepIndex(bookingStatus, transactionStatus);

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs",
                  done
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 text-gray-300",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-0.5 h-8", done ? "bg-primary" : "bg-gray-200")} />
              )}
            </div>
            <div className="pb-6">
              <p className={cn("text-sm font-medium", active ? "text-primary" : done ? "text-gray-700" : "text-gray-400")}>
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
