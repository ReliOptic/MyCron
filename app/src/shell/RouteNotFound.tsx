import { Link } from "react-router-dom";
import { EmptyState } from "@contract/components/primitives";
import { useAppCopy } from "./context";

export function RouteNotFound({ demoMode }: { demoMode: boolean }) {
  const demo = demoMode ? "?demo=1" : "";
  const { tc } = useAppCopy();
  return <div className="not-found"><EmptyState title={tc("notFound.title")} hint={tc("notFound.hint")} /><div className="empty-actions"><Link to={`/${demo}`} className="primary-btn">{tc("action.backToToday")}</Link>{!demoMode && <Link to="/?demo=1" className="ghost-btn">{tc("action.viewDemo")}</Link>}</div></div>;
}
