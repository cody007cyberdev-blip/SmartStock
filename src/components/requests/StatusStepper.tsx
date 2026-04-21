import { useTranslation } from "react-i18next";
import { Check, Circle, X } from "lucide-react";
import { RequestStatus } from "@/types/inventory";
import { cn } from "@/lib/utils";

type StepKey = "submitted" | "review" | "decision" | "fulfilled";

const STEPS: StepKey[] = ["submitted", "review", "decision", "fulfilled"];

function resolveStep(status: RequestStatus): {
  activeIdx: number;
  decisionKey: "decision" | "approved" | "partial" | "declined";
  isTerminal: boolean;
  isNegative: boolean;
} {
  switch (status) {
    case RequestStatus.Pending:
      return { activeIdx: 1, decisionKey: "decision", isTerminal: false, isNegative: false };
    case RequestStatus.Approved:
      return { activeIdx: 2, decisionKey: "approved", isTerminal: false, isNegative: false };
    case RequestStatus.PartiallyFulfilled:
      return { activeIdx: 2, decisionKey: "partial", isTerminal: false, isNegative: false };
    case RequestStatus.Fulfilled:
      return { activeIdx: 3, decisionKey: "approved", isTerminal: true, isNegative: false };
    case RequestStatus.Declined:
      return { activeIdx: 2, decisionKey: "declined", isTerminal: true, isNegative: true };
    case RequestStatus.Cancelled:
      return { activeIdx: 1, decisionKey: "decision", isTerminal: true, isNegative: true };
    default:
      return { activeIdx: 0, decisionKey: "decision", isTerminal: false, isNegative: false };
  }
}

interface StatusStepperProps {
  status: RequestStatus;
}

export function StatusStepper({ status }: StatusStepperProps) {
  const { t } = useTranslation();
  const { activeIdx, decisionKey, isTerminal, isNegative } = resolveStep(status);

  const labels = STEPS.map((s) =>
    s === "decision" ? t(`requests.stepper.${decisionKey}` as const) : t(`requests.stepper.${s}` as const),
  );

  return (
    <div className="flex items-center gap-0" role="list" aria-label="Request status">
      {labels.map((label, idx) => {
        const isCompleted = idx < activeIdx;
        const isActive = idx === activeIdx;
        const isFuture = idx > activeIdx;
        const isLast = idx === labels.length - 1;

        if (isLast && isTerminal && isNegative && idx > activeIdx) return null;

        return (
          <div key={idx} className="flex items-center" role="listitem">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-stock-healthy bg-stock-healthy text-stock-healthy-foreground",
                  isActive && !isNegative && "border-primary bg-primary text-primary-foreground",
                  isActive && isNegative && "border-destructive bg-destructive text-destructive-foreground",
                  isFuture && "border-muted-foreground/30 bg-transparent text-muted-foreground/30",
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isActive && isNegative ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  isCompleted && "text-stock-healthy",
                  isActive && !isNegative && "text-primary",
                  isActive && isNegative && "text-destructive",
                  isFuture && "text-muted-foreground/50",
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && !(isLast && isTerminal && isNegative) && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-6 sm:w-10",
                  idx < activeIdx ? "bg-stock-healthy" : "bg-muted-foreground/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
