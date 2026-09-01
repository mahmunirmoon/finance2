import { useEffect, useRef, useState } from "react";
import {
  Check, Coins, Database, Download, HardDrive, HeartPulse, Pencil, RotateCcw, Upload, UserPlus, Users,
} from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { usePlanning } from "../hooks/usePlanning";
import MemberFormModal from "../features/members/MemberFormModal";
import MemberDeleteDialog from "../components/members/MemberDeleteDialog";
import PinSettings from "../components/pin/PinSettings";
import { ConfirmDialog } from "../components/ui/Modal";
import { CURRENCIES } from "../data/currencies";
import { createDemoPlanning } from "../data/demoPlanning";
import { exportBackup, parseBackup, type BackupData } from "../utils/export";
import { checkDataIntegrity, type DataIntegrityIssue } from "../utils/dataIntegrity";
import { getStorageStatus } from "../utils/safeStorage";
import { faNum, formatDate, formatJalali } from "../utils/format";
import type { CurrencyCode, FamilyMember } from "../types";

export default function SettingsPage() {
  const {
    family, renameFamily, updateFamilyCurrency, loadDemoFamily,
    restoreFamily, resetAll, pushToast,
  } = useFamily();
  const { loadDemoFinance, setFinanceData, accounts, transactions } = useFinance();
  const planning = usePlanning();

  const [nameDraft, setNameDraft] = useState(family?.name ?? "");
  const [nameError, setNameError] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<FamilyMember | null>(null);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [confirmFinanceDemo, setConfirmFinanceDemo] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmExportPrivacy, setConfirmExportPrivacy] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [healthIssues, setHealthIssues] = useState<DataIntegrityIssue[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameDraft(family?.name ?? "");
  }, [family?.name]);

  if (!family) return null;

  const nameChanged = nameDraft.trim() !== family.name && nameDraft.trim().length > 0;

  const saveName = () => {
    if (!nameDraft.trim()) return setNameError(true);
    renameFamily(nameDraft);
    pushToast("نام خانواده به‌روزرسانی شد");
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const collectBackup = (): BackupData => ({
    family,
    accounts,
    transactions,
    budgets: planning.budgets,
    debts: planning.debts,
    receivables: planning.receivables,
    installmentPlans: planning.installmentPlans,
    installmentItems: planning.installmentItems,
    recurringPayments: planning.recurringPayments,
    financialPlans: planning.financialPlans,
    financialPlanItems: planning.financialPlanItems,
    savingsGoals: planning.savingsGoals,
    savingsContributions: planning.savingsContributions,
  });

  /* قبل از خروجی، هشدار حریم خصوصی نمایش داده می‌شود */
  const doExportBackup = () => {
    setConfirmExportPrivacy(true);
  };

  const confirmExportBackup = () => {
    setConfirmExportPrivacy(false);
    try {
      exportBackup(collectBackup());
      pushToast("فایل پشتیبان دانلود شد");
    } catch {
      pushToast("پشتیبان‌گیری ناموفق بود", "danger");
    }
  };

  /* بررسی سلامت اطلاعات — بدون تغییر داده */
  const runHealthCheck = () => {
    const issues = checkDataIntegrity(collectBackup());
    setHealthIssues(issues);
    if (issues.length === 0) pushToast("اطلاعات سالم است");
    else pushToast(`${faNum(issues.length)} مورد نیازمند بررسی پیدا شد`, "info");
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseBackup(String(reader.result ?? ""));
      if (!result.ok) {
        pushToast(result.error, "danger");
        return;
      }
      setPendingBackup(result.data);
    };
    reader.onerror = () => pushToast("خواندن فایل ناموفق بود", "danger");
    reader.readAsText(file);
  };

  const applyBackup = (data: BackupData) => {
    /* پشتیبان‌گیری خودکار از داده فعلی برای بازگردانی در صورت شکست */
    const snapshot = collectBackup();
    const planningState = {
      budgets: data.budgets,
      debts: data.debts,
      receivables: data.receivables,
      installmentPlans: data.installmentPlans,
      installmentItems: data.installmentItems,
      recurringPayments: data.recurringPayments,
      financialPlans: data.financialPlans,
      financialPlanItems: data.financialPlanItems,
      savingsGoals: data.savingsGoals,
      savingsContributions: data.savingsContributions,
    };
    try {
      restoreFamily(data.family);
      setFinanceData(data.accounts, data.transactions);
      planning.restorePlanning(planningState);
      pushToast("بازیابی با موفقیت انجام شد");
    } catch {
      /* بازگردانی داده قبلی — هیچ‌گاه حالت نیمه‌واردشده باقی نماند */
      restoreFamily(snapshot.family);
      setFinanceData(snapshot.accounts, snapshot.transactions);
      planning.restorePlanning({
        budgets: snapshot.budgets,
        debts: snapshot.debts,
        receivables: snapshot.receivables,
        installmentPlans: snapshot.installmentPlans,
        installmentItems: snapshot.installmentItems,
        recurringPayments: snapshot.recurringPayments,
        financialPlans: snapshot.financialPlans,
        financialPlanItems: snapshot.financialPlanItems,
        savingsGoals: snapshot.savingsGoals,
        savingsContributions: snapshot.savingsContributions,
      });
      pushToast("فایل پشتیبان معتبر نیست و هیچ داده‌ای تغییر نکرد.", "danger");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">تنظیمات خانواده</h1>
        <p className="mt-1 text-xs text-mute">نام خانواده، اعضا، ارز پایه، داده‌های نمونه و پشتیبان‌گیری.</p>
      </div>

      {/* مشخصات خانواده */}
      <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-50 text-pine-600"><Pencil size={16} /></span>
          <div>
            <h2 className="text-base font-extrabold text-ink">مشخصات خانواده</h2>
            <p className="text-[11px] text-mute">ایجادشده در {formatDate(family.createdAt)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={nameDraft}
            onChange={(e) => { setNameDraft(e.target.value); setNameError(false); }}
            placeholder="نام خانواده"
            aria-label="نام خانواده"
            className={`flex-1 rounded-xl border bg-surface px-4 py-3 text-sm font-bold text-ink transition focus:outline-none focus:ring-2 ${
              nameError ? "border-danger focus:ring-danger/25" : "border-line focus:border-pine-500 focus:ring-pine-500/25"
            }`}
          />
          <button onClick={saveName} disabled={!nameChanged} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pine-600 px-6 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40">
            <Check size={15} strokeWidth={3} />
            ذخیره تغییرات
          </button>
        </div>
        {nameError && <p className="mt-2 text-[11px] font-bold text-danger">نام خانواده نمی‌تواند خالی باشد.</p>}
        <div className="mt-4 max-w-xs">
          <label htmlFor="family-currency" className="mb-1.5 block text-xs font-extrabold text-ink">ارز پایه خانواده</label>
          <select
            id="family-currency"
            value={family.currency}
            onChange={(e) => {
              updateFamilyCurrency(e.target.value as CurrencyCode);
              pushToast("ارز پایه خانواده تغییر کرد", "info");
            }}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm font-bold text-ink transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-[10px] leading-4 text-mute">
            جمع‌های داشبورد و گزارش‌ها با این ارز نمایش داده می‌شوند؛ هر حساب ارز خودش را جدا نگه می‌دارد و نرخ تبدیل ارز هنوز پیاده نشده است.
          </p>
        </div>
      </section>

      {/* مدیریت خانواده */}
      <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" style={{ animationDelay: "80ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-50 text-pine-600"><Users size={16} /></span>
            <div>
              <h2 className="text-base font-extrabold text-ink">مدیریت خانواده</h2>
              <p className="text-[11px] text-mute">{faNum(family.members.length)} عضو · افزودن، ویرایش، حذف و تغییر نیازها</p>
            </div>
          </div>
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
            <UserPlus size={14} />
            افزودن عضو
          </button>
        </div>
        {family.members.length === 0 ? (
          <p className="mt-4 rounded-xl bg-paper/70 px-4 py-4 text-center text-xs text-mute">عضوی ثبت نشده است؛ اولین عضو را اضافه کنید.</p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {family.members.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface p-3.5 shadow-card">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-ink">{m.name}</p>
                  <p className="text-[11px] font-bold text-mute">{m.needs.length.toLocaleString("fa-IR")} نیاز ثبت‌شده</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(m); setFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label={`ویرایش ${m.name}`}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleting(m)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label={`حذف ${m.name}`}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* داده‌های نمونه */}
      <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" style={{ animationDelay: "160ms" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600"><HardDrive size={16} /></span>
          <div>
            <h2 className="text-base font-extrabold text-ink">داده‌ها</h2>
            <p className="text-[11px] text-mute">همه اطلاعات فقط در مرورگر شما (LocalStorage) ذخیره می‌شود.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button onClick={() => setConfirmDemo(true)} className="flex items-center gap-3 rounded-xl border border-line bg-paper/50 px-4 py-3.5 text-start transition hover:border-pine-300 hover:bg-pine-50/50 active:scale-[0.99]">
            <Database size={17} className="shrink-0 text-pine-600" />
            <span>
              <span className="block text-sm font-extrabold text-ink">بارگذاری نسخه نمونه کامل</span>
              <span className="mt-0.5 block text-[11px] text-mute">خانواده + حساب‌ها + تراکنش‌ها + برنامه‌ریزی</span>
            </span>
          </button>
          <button onClick={() => setConfirmFinanceDemo(true)} className="flex items-center gap-3 rounded-xl border border-line bg-paper/50 px-4 py-3.5 text-start transition hover:border-pine-300 hover:bg-pine-50/50 active:scale-[0.99]">
            <Coins size={17} className="shrink-0 text-pine-600" />
            <span>
              <span className="block text-sm font-extrabold text-ink">فقط داده‌های مالی نمونه</span>
              <span className="mt-0.5 block text-[11px] text-mute">جایگزینی {faNum(accounts.length)} حساب و {faNum(transactions.length)} تراکنش فعلی</span>
            </span>
          </button>
        </div>
      </section>

      {/* پشتیبان‌گیری و بازیابی */}
      <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-50 text-pine-600"><Download size={16} /></span>
          <div>
            <h2 className="text-base font-extrabold text-ink">پشتیبان‌گیری و بازیابی</h2>
            <p className="text-[11px] text-mute">فایل JSON نسخه‌بندی‌شده شامل همه داده‌های خانواده، حساب‌ها، تراکنش‌ها و برنامه‌ریزی.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={doExportBackup} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-xs font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
            <Download size={15} />
            دانلود فایل پشتیبان
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-xs font-extrabold text-ink-soft shadow-card transition hover:border-pine-300 hover:text-pine-700 active:scale-[0.97]">
            <Upload size={15} />
            بازیابی از فایل
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} aria-label="انتخاب فایل پشتیبان" />
        </div>
        <button onClick={() => setConfirmReset(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-xs font-extrabold text-danger transition hover:bg-danger hover:text-white active:scale-[0.97]">
          <RotateCcw size={14} />
          شروع دوباره از ابتدا (حذف همه داده‌ها)
        </button>
      </section>

      {/* بررسی سلامت اطلاعات */}
      <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-50 text-pine-600"><HeartPulse size={16} /></span>
          <div>
            <h2 className="text-base font-extrabold text-ink">بررسی سلامت اطلاعات</h2>
            <p className="text-[11px] text-mute">ارجاع‌های شکسته، آیدی‌های تکراری و داده‌های نامعتبر را شناسایی می‌کند.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={runHealthCheck} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-xs font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
            <HeartPulse size={15} />
            بررسی الان
          </button>
          {healthIssues !== null && healthIssues.length === 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs font-extrabold text-success">
              <Check size={14} strokeWidth={3} />
              اطلاعات سالم است
            </span>
          )}
        </div>
        {healthIssues !== null && healthIssues.length > 0 && (
          <ul className="mt-4 space-y-2">
            {healthIssues.map((iss) => (
              <li key={iss.id} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold leading-5 ${
                iss.severity === "error" ? "border-danger/30 bg-danger-soft text-danger" : "border-saffron-300 bg-saffron-50 text-saffron-700"
              }`}>
                <span className="mt-0.5 shrink-0">[{iss.entity}]</span>
                <span>{iss.message}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* قفل برنامه */}
      <PinSettings />

      {/* مودال‌ها */}
      <MemberFormModal open={formOpen} member={editing} onClose={() => setFormOpen(false)} />

      <MemberDeleteDialog member={deleting} onClose={() => setDeleting(null)} />

      <ConfirmDialog
        open={confirmDemo}
        onClose={() => setConfirmDemo(false)}
        title="بارگذاری نسخه نمونه کامل"
        message="اطلاعات فعلی (خانواده، حساب‌ها، تراکنش‌ها و برنامه‌ریزی) با نسخه نمونه جایگزین می‌شود. ادامه می‌دهید؟"
        confirmLabel="جایگزین شود"
        onConfirm={() => {
          const fam = loadDemoFamily();
          const finance = loadDemoFinance(fam);
          const planningDemo = createDemoPlanning(fam, finance.accounts);
          setFinanceData([...finance.accounts], [...finance.transactions, ...planningDemo.extraTransactions]);
          planning.loadDemoPlanning(planningDemo);
          pushToast("نسخه نمونه کامل بارگذاری شد", "info");
        }}
      />

      <ConfirmDialog
        open={confirmFinanceDemo}
        onClose={() => setConfirmFinanceDemo(false)}
        title="بارگذاری داده‌های مالی نمونه"
        message={`حساب‌ها و تراکنش‌های فعلی با داده نمونه جایگزین می‌شوند. این عمل فقط با درخواست شما انجام می‌شود.`}
        confirmLabel="جایگزین شود"
        onConfirm={() => {
          const finance = loadDemoFinance(family);
          setFinanceData(finance.accounts, finance.transactions);
          pushToast("داده‌های مالی نمونه بارگذاری شد", "info");
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="شروع دوباره از ابتدا"
        message="تمام اطلاعات خانواده، اعضا، حساب‌ها، تراکنش‌ها و برنامه‌ریزی برای همیشه حذف می‌شود و به صفحه خوش‌آمدگویی برمی‌گردید."
        confirmLabel="حذف همه‌چیز"
        onConfirm={() => {
          planning.resetPlanning();
          resetAll();
          pushToast("همه داده‌ها حذف شد", "danger");
        }}
      />

      <ConfirmDialog
        open={pendingBackup !== null}
        onClose={() => setPendingBackup(null)}
        title="بازیابی فایل پشتیبان"
        message={
          pendingBackup
            ? `فایل پشتیبان معتبر است (خانواده «${pendingBackup.family.name}» با ${faNum(pendingBackup.family.members.length)} عضو و ${faNum(pendingBackup.transactions.length)} تراکنش). اطلاعات فعلی جایگزین می‌شوند. ادامه می‌دهید؟`
            : ""
        }
        confirmLabel="بله، جایگزین شود"
        onConfirm={() => {
          if (pendingBackup) applyBackup(pendingBackup);
        }}
      />

      <ConfirmDialog
        open={confirmExportPrivacy}
        onClose={() => setConfirmExportPrivacy(false)}
        title="خروجی فایل پشتیبان"
        message="این فایل شامل اطلاعات مالی خانواده است. آن را در محل امن نگهداری کنید. فایل به‌صورت متن ساده (JSON) ذخیره می‌شود و رمزنگاری نشده است."
        confirmLabel="دانلود فایل"
        cancelLabel="انصراف"
        onConfirm={confirmExportBackup}
      />
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}


