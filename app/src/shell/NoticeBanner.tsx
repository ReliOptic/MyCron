import { useNotice } from "./context";

export function NoticeBanner() {
  const { notice, clearNotice } = useNotice();
  if (!notice) return null;
  return <div className="notice" role="status" aria-live="polite"><div><b>{notice.title}</b>{notice.detail && <span>{notice.detail}</span>}</div><button type="button" onClick={clearNotice} aria-label="Dismiss notice">×</button></div>;
}
