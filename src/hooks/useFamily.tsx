import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CurrencyCode, Family, FamilyMember, MemberDraft } from "../types";
import { loadFamily, saveFamily, clearFamily } from "../storage/familyStorage";
import { createDemoFamily } from "../data/demo";
import { uid } from "../utils/id";

interface ToastItem {
  id: string;
  message: string;
  tone: "success" | "danger" | "info";
}

interface FamilyContextValue {
  family: Family | null;
  toasts: ToastItem[];
  pushToast: (message: string, tone?: ToastItem["tone"]) => void;
  dismissToast: (id: string) => void;
  createFamily: (name: string, members: MemberDraft[]) => void;
  renameFamily: (name: string) => void;
  updateFamilyCurrency: (currency: CurrencyCode) => void;
  addMember: (draft: MemberDraft) => void;
  updateMember: (id: string, draft: MemberDraft) => void;
  removeMember: (id: string) => void;
  loadDemoFamily: () => Family;
  /** بازیابی کامل خانواده از فایل پشتیبان (Mission 5) */
  restoreFamily: (family: Family) => void;
  resetAll: () => void;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [family, setFamily] = useState<Family | null>(() => loadFamily());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (family) saveFamily(family);
    else clearFamily();
  }, [family]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastItem["tone"] = "success") => {
      const id = uid();
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      timers.current[id] = setTimeout(() => dismissToast(id), 3800);
    },
    [dismissToast]
  );

  const createFamily = useCallback((name: string, members: MemberDraft[]) => {
    const now = new Date().toISOString();
    const familyId = uid();
    setFamily({
      id: familyId,
      name: name.trim(),
      createdAt: now,
      setupCompleted: true,
      currency: "toman",
      members: members.map((m) => ({ ...m, id: uid(), familyId, createdAt: now, updatedAt: now })),
    });
  }, []);

  const renameFamily = useCallback((name: string) => {
    setFamily((prev) => (prev ? { ...prev, name: name.trim() } : prev));
  }, []);

  const updateFamilyCurrency = useCallback((currency: CurrencyCode) => {
    setFamily((prev) => (prev ? { ...prev, currency } : prev));
  }, []);

  const addMember = useCallback((draft: MemberDraft) => {
    const now = new Date().toISOString();
    setFamily((prev) => {
      if (!prev) return prev;
      return { ...prev, members: [...prev.members, { ...draft, id: uid(), familyId: prev.id, createdAt: now, updatedAt: now }] };
    });
  }, []);

  const updateMember = useCallback((id: string, draft: MemberDraft) => {
    setFamily((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        members: prev.members.map((m) => (m.id === id ? { ...m, ...draft, updatedAt: new Date().toISOString() } : m)),
      };
    });
  }, []);

  const removeMember = useCallback((id: string) => {
    setFamily((prev) => (prev ? { ...prev, members: prev.members.filter((m) => m.id !== id) } : prev));
  }, []);

  const loadDemoFamily = useCallback((): Family => {
    const fam = createDemoFamily();
    setFamily(fam);
    return fam;
  }, []);

  const restoreFamily = useCallback((fam: Family) => {
    setFamily(fam);
  }, []);

  const resetAll = useCallback(() => {
    setFamily(null);
  }, []);

  const value = useMemo(
    () => ({
      family, toasts, pushToast, dismissToast, createFamily, renameFamily, updateFamilyCurrency,
      addMember, updateMember, removeMember, loadDemoFamily, restoreFamily, resetAll,
    }),
    [family, toasts, pushToast, dismissToast, createFamily, renameFamily, updateFamilyCurrency,
      addMember, updateMember, removeMember, loadDemoFamily, restoreFamily, resetAll]
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily باید داخل FamilyProvider استفاده شود");
  return ctx;
}

export type { ToastItem };
