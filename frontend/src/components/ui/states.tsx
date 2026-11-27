import { AlertCircle, FolderOpen, RefreshCw, UsersRound } from "lucide-react";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return <div aria-label="Loading" className="animate-pulse space-y-3">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-14 rounded-xl bg-muted" />)}</div>;
}

export function EmptyState({ title, description, action, type = "projects" }: { title: string; description: string; action?: ReactNode; type?: "projects" | "users" }) {
  const Icon = type === "users" ? UsersRound : FolderOpen;
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
    <span className="mb-4 rounded-2xl bg-muted p-4 text-muted-foreground"><Icon aria-hidden className="size-7" /></span>
    <h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>;
}

export function ErrorState({ onRetry, message = "We could not load this information." }: { onRetry?: () => void; message?: string }) {
  return <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 px-6 py-14 text-center">
    <AlertCircle aria-hidden className="size-8 text-danger" /><h2 className="mt-3 text-lg font-semibold">Something went wrong</h2><p className="mt-2 text-sm text-muted-foreground">{message}</p>
    {onRetry && <Button className="mt-5" variant="secondary" onClick={onRetry}><RefreshCw aria-hidden className="size-4" />Try again</Button>}
  </div>;
}

export function PermissionDenied() {
  return <div role="alert" className="rounded-2xl border border-warning/30 bg-warning/10 p-8 text-center"><AlertCircle aria-hidden className="mx-auto size-8 text-warning" /><h1 className="mt-3 text-xl font-semibold">Permission required</h1><p className="mt-2 text-sm text-muted-foreground">You do not have permission to view this page.</p></div>;
}
