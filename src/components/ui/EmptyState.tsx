import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="animate-fade-up flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-50 text-pine-600">{icon}</span>
      <h3 className="mt-4 text-base font-extrabold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-mute">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
