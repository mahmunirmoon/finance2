import { AlertTriangle, CalendarClock, Flag, Lightbulb, PiggyBank, ShieldCheck, Sparkles } from "lucide-react";
import Modal from "../ui/Modal";
import InsightItem from "./InsightItem";
import type { FinancialInsight } from "../../utils/insights";

interface SmartAssistantModalProps {
  open: boolean;
  onClose: () => void;
  insights: FinancialInsight[];
  hasData: boolean;
}

/** نمای کامل هوش کمکی — دسته‌بندی‌شده در ۶ بخش */
export default function SmartAssistantModal({ open, onClose, insights, hasData }: SmartAssistantModalProps) {
  const byPriority = (p: FinancialInsight["priority"][]) => insights.filter((i) => p.includes(i.priority));
  const byType = (types: FinancialInsight["type"][]) => insights.filter((i) => types.includes(i.type));

  const sections: { title: string; icon: React.ReactNode; items: FinancialInsight[] }[] = [
    { title: "پیشنهاد‌های امروز", icon: <Sparkles size={14} className="text-saffron-500" />, items: insights.slice(0, 3) },
    { title: "هشدارهای مالی", icon: <AlertTriangle size={14} className="text-danger" />, items: byPriority(["critical", "warning"]) },
    { title: "فرصت‌های پس‌انداز", icon: <Lightbulb size={14} className="text-success" />, items: byPriority(["opportunity"]) },
    { title: "وضعیت بودجه", icon: <PiggyBank size={14} className="text-pine-600" />, items: byType(["budget-warning"]) },
    { title: "برنامه‌های آینده", icon: <Flag size={14} className="text-pine-600" />, items: byType(["plan-progress", "savings-goal"]) },
    { title: "تعهدات نزدیک", icon: <CalendarClock size={14} className="text-saffron-600" />, items: byType(["upcoming-payments", "installment-alert", "debt-alert"]) },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="هوش کمکی"
      subtitle="پیشنهاد‌ها، هشدارها و تحلیل‌های کوتاه مالی — کاملاً آفلاین و مبتنی بر داده‌های شما"
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-mute">
            <ShieldCheck size={13} className="text-success" />
            بدون اتصال به اینترنت · بدون هیچ API خارجی
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper active:scale-[0.98]"
          >
            بستن
          </button>
        </div>
      }
    >
      {!hasData || insights.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pine-50 text-pine-500">
            <Sparkles size={28} />
          </span>
          <h3 className="mt-4 text-base font-extrabold text-ink">هنوز داده کافی برای تحلیل وجود ندارد.</h3>
          <p className="mt-2 max-w-sm text-sm leading-7 text-mute">
            چند تراکنش، بودجه یا هدف مالی ثبت کنید تا پیشنهاد‌های هوشمند نمایش داده شوند.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections
            .filter((s) => s.items.length > 0)
            .map((s) => (
              <section key={s.title}>
                <h3 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold text-ink">
                  {s.icon}
                  {s.title}
                  <span className="rounded-full bg-paper px-2 py-0.5 text-[9px] font-black text-mute">
                    {s.items.length.toLocaleString("fa-IR")}
                  </span>
                </h3>
                <div className="space-y-2">
                  {s.items.map((i) => (
                    <InsightItem key={`${s.title}-${i.id}`} insight={i} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </Modal>
  );
}
