import { lazy, Suspense, useState } from "react";
import { FamilyProvider, useFamily } from "./hooks/useFamily";
import { FinanceProvider, useFinance } from "./hooks/useFinance";
import { PlanningProvider, usePlanning } from "./hooks/usePlanning";
import WelcomePage from "./pages/WelcomePage";
import SetupWizard from "./features/setup/SetupWizard";
import AppShell from "./layout/AppShell";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import AccountsPage from "./pages/AccountsPage";
import BudgetsPage from "./pages/BudgetsPage";
import DebtsReceivablesPage from "./pages/DebtsReceivablesPage";
import InstallmentsPage from "./pages/InstallmentsPage";
import RecurringPaymentsPage from "./pages/RecurringPaymentsPage";
import FinancialPlansPage from "./pages/FinancialPlansPage";
import SavingsPage from "./pages/SavingsPage";
import MembersPage from "./pages/MembersPage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";
import TransactionFormModal from "./components/finance/TransactionFormModal";
import QuickExpenseModal from "./components/finance/QuickExpenseModal";
import Toasts from "./components/ui/Toasts";
import { createDemoPlanning } from "./data/demoPlanning";
import type { PageId, Transaction } from "./types";

/* گزارش‌ها + Recharts فقط هنگام مراجعه بارگذاری می‌شوند */
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex items-center gap-3 text-xs font-extrabold text-mute">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pine-500" />
        در حال بارگذاری گزارش‌ها…
      </div>
    </div>
  );
}

function AppContent() {
  const { family, loadDemoFamily, pushToast } = useFamily();
  const { loadDemoFinance, setFinanceData } = useFinance();
  const { loadDemoPlanning } = usePlanning();

  const [view, setView] = useState<"welcome" | "setup" | "app">(family ? "app" : "welcome");
  const [page, setPage] = useState<PageId>("dashboard");
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  const openNewTransaction = () => {
    setEditingTx(null);
    setTxModalOpen(true);
  };
  const openEditTransaction = (t: Transaction) => {
    setEditingTx(t);
    setTxModalOpen(true);
  };

  const handleDemo = () => {
    const fam = loadDemoFamily();
    const finance = loadDemoFinance(fam);
    const planning = createDemoPlanning(fam, finance.accounts);
    setFinanceData([...finance.accounts], [...finance.transactions, ...planning.extraTransactions]);
    loadDemoPlanning(planning);
    setView("app");
    pushToast(
      `نسخه نمونه کامل بارگذاری شد — ${finance.accounts.length.toLocaleString("fa-IR")} حساب، ${(finance.transactions.length + planning.extraTransactions.length).toLocaleString("fa-IR")} تراکنش و ${planning.financialPlans.length.toLocaleString("fa-IR")} برنامه مالی`,
      "info"
    );
  };

  if (!family) {
    return view === "setup" ? (
      <SetupWizard initial={null} onExit={() => setView("welcome")} />
    ) : (
      <WelcomePage onStart={() => setView("setup")} onDemo={handleDemo} />
    );
  }

  return (
    <AppShell page={page} onNavigate={setPage} onNewTransaction={openNewTransaction}>
      {page === "dashboard" && (
        <DashboardPage onNavigate={setPage} onNewTransaction={openNewTransaction} onQuickExpense={() => setQuickOpen(true)} />
      )}
      {page === "transactions" && (
        <TransactionsPage onNewTransaction={openNewTransaction} onEditTransaction={openEditTransaction} />
      )}
      {page === "accounts" && <AccountsPage />}
      {page === "budgets" && <BudgetsPage />}
      {page === "plans" && <FinancialPlansPage />}
      {page === "savings" && <SavingsPage />}
      {page === "debts" && <DebtsReceivablesPage />}
      {page === "installments" && <InstallmentsPage />}
      {page === "recurring" && <RecurringPaymentsPage />}
      {page === "reports" && (
        <Suspense fallback={<PageFallback />}>
          <ReportsPage />
        </Suspense>
      )}
      {page === "members" && <MembersPage />}
      {page === "settings" && <SettingsPage />}
      {page === "about" && <AboutPage />}

      <TransactionFormModal
        open={txModalOpen}
        editing={editingTx}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
      />
      <QuickExpenseModal open={quickOpen} onClose={() => setQuickOpen(false)} />
    </AppShell>
  );
}

export default function App() {
  return (
    <FamilyProvider>
      <FinanceProvider>
        <PlanningProvider>
          <AppContent />
          <Toasts />
        </PlanningProvider>
      </FinanceProvider>
    </FamilyProvider>
  );
}
