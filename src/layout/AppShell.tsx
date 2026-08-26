import { useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, Menu, Plus, Users, X } from "lucide-react";
import type { PageId } from "../types";
import { NAV_GROUPS, getPageTitle } from "./nav";
import { useFamily } from "../hooks/useFamily";
import { faNum, formatDate } from "../utils/format";
import Logo from "./Logo";

function SidebarContent({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  const { family } = useFamily();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <Logo size={40} />
        <div className="min-w-0">
          <p className="text-sm font-extrabold leading-5 text-ink">مدیریت مالی خانواده</p>
          <p className="truncate text-[11px] text-mute">{family?.name ?? ""}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2" aria-label="ناوبری اصلی">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="mb-1 px-3 text-[9px] font-black uppercase text-mute/80">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.id === page;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-150 ${
                      active
                        ? "bg-pine-50 font-extrabold text-pine-800"
                        : "font-semibold text-ink-soft hover:bg-paper hover:text-ink"
                    }`}
                  >
                    {active && <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-saffron-400" />}
                    <Icon size={16} className={active ? "text-pine-600" : "text-mute"} />
                    {item.label}
                    {item.id === "members" && family && (
                      <span className="ms-auto rounded-full bg-line/70 px-2 py-0.5 text-[10px] font-extrabold text-ink-soft">
                        {faNum(family.members.length)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3">
        <div className="rounded-xl bg-pine-800 p-4 text-pine-50">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span>مأموریت ۵ از ۵</span>
            <span className="text-saffron-300">۱۰۰٪</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pine-700">
            <div className="h-full w-full rounded-full bg-saffron-400" />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-pine-200">
            محصول کامل — گزارش‌ها، نمودارها، خروجی و پشتیبان‌گیری فعال است.
          </p>
        </div>
      </div>
    </div>
  );
}

interface AppShellProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  onNewTransaction: () => void;
  children: ReactNode;
}

/** پوسته اصلی — سایدبار گروه‌بندی‌شده + هدر + محتوا */
export default function AppShell({ page, onNavigate, onNewTransaction, children }: AppShellProps) {
  const { family } = useFamily();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const today = formatDate(new Date().toISOString());

  const navigate = (p: PageId) => {
    onNavigate(p);
    setDrawerOpen(false);
  };

  return (
    <div className="print-hidden relative flex min-h-screen">
      <div className="bg-girih pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <div className="pointer-events-none fixed -top-40 -start-40 -z-10 h-[26rem] w-[26rem] rounded-full bg-pine-200/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none fixed -bottom-48 -end-32 -z-10 h-[26rem] w-[26rem] rounded-full bg-saffron-200/30 blur-3xl" aria-hidden="true" />

      <aside className="sticky top-0 z-20 hidden h-screen w-64 shrink-0 border-e border-line bg-surface/85 backdrop-blur lg:block">
        <SidebarContent page={page} onNavigate={navigate} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-ink/45" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="animate-scale-in absolute inset-y-0 start-0 w-72 bg-surface shadow-pop">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 end-4 rounded-lg p-2 text-mute transition hover:bg-paper hover:text-ink" aria-label="بستن منو">
              <X size={18} />
            </button>
            <SidebarContent page={page} onNavigate={navigate} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-10">
            <button onClick={() => setDrawerOpen(true)} className="rounded-lg border border-line bg-surface p-2 text-ink-soft transition hover:bg-pine-50 hover:text-pine-700 lg:hidden" aria-label="باز کردن منو">
              <Menu size={17} />
            </button>
            <h2 className="font-display text-xl text-ink">{getPageTitle(page)}</h2>
            <div className="ms-auto flex items-center gap-2">
              <button
                onClick={onNewTransaction}
                className="inline-flex items-center gap-1.5 rounded-xl bg-pine-600 px-3.5 py-2 text-[11px] font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
              >
                <Plus size={14} strokeWidth={3} />
                <span className="hidden sm:inline">ثبت تراکنش</span>
              </button>
              <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-bold text-ink-soft xl:inline-flex">
                <CalendarDays size={13} className="text-pine-600" />
                {today}
              </span>
              {family && (
                <span className="hidden items-center gap-1.5 rounded-full bg-pine-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-card md:inline-flex">
                  <Users size={13} />
                  {family.name} · {faNum(family.members.length)} عضو
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div key={page} className="animate-fade-up mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
