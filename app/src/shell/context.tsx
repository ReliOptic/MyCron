import { createContext, useContext } from "react";
import type { CopyKey, Language } from "../i18n/copy";

export type Notice = { title: string; detail?: string } | null;
export type NoticeContextValue = {
  notice: Notice;
  showNotice: (title: string, detail?: string) => void;
  clearNotice: () => void;
};
export type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  tc: (key: CopyKey, values?: Record<string, string | number>) => string;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);
export const NoticeContext = createContext<NoticeContextValue | null>(null);

export function useAppCopy() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useAppCopy must be used inside AppShell");
  return ctx;
}

export function useNotice() {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotice must be used inside AppShell");
  return ctx;
}
