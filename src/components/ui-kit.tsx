import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FEE_STATUS_LABEL, type FeeStatus } from "@/lib/format";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string | undefined;
  icon?: ReactNode | undefined;
  tone?: "default" | "success" | "warning" | "danger" | "brand" | undefined;
}) {
  const toneClass = {
    default: "bg-muted text-foreground",
    brand: "bg-primary-soft text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
  }[tone];

  return (
    <div className="card-surface relative overflow-hidden p-4 transition-shadow duration-300 hover:shadow-elegant sm:p-5">
      <span className="brand-gradient absolute inset-x-0 top-0 h-1 opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon ? (
          <span className={cn("flex size-9 items-center justify-center rounded-lg", toneClass)}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function FeeStatusBadge({ status }: { status: FeeStatus }) {
  const map: Record<FeeStatus, string> = {
    PAID: "bg-success/12 text-success border-success/25",
    PARTIALLY_PAID: "bg-warning/18 text-warning-foreground border-warning/35",
    DUE: "bg-destructive/12 text-destructive border-destructive/25",
  };
  const dot: Record<FeeStatus, string> = {
    PAID: "bg-success",
    PARTIALLY_PAID: "bg-warning",
    DUE: "bg-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        map[status],
      )}
    >
      <span className={cn("size-2 rounded-full", dot[status])} />
      {FEE_STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="card-surface flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card-surface divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 p-4">
          <div className="size-9 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-3 w-1/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="card-surface border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
      {message ?? "Something went wrong while loading this data. Please try again."}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
