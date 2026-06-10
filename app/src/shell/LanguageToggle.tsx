import { useAppCopy } from "./context";

export function LanguageToggle() {
  const { language, setLanguage, tc } = useAppCopy();
  const next = language === "en" ? "ko" : "en";
  const label = language === "en" ? tc("lang.switchToKorean") : tc("lang.switchToEnglish");
  return <button className="language-toggle" type="button" onClick={() => setLanguage(next)} aria-label={label}><span>{tc("lang.current")}</span><span aria-hidden="true">/</span><span>{tc("lang.next")}</span></button>;
}
