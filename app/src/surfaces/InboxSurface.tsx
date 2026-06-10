import { useNavigate } from "react-router-dom";
import { EmptyState } from "@contract/components/primitives";
import { useCronletActions, useInbox } from "@contract/data/hooks";
import type { InboxRequest } from "@contract/types/mycron";
import { useAppCopy } from "../shell/context";
import { Inbox, Wand2 } from "../shell/icons";
import { demoSearch, PageHead, Skeleton } from "../shell/primitives";

export function InboxSurface() {
  const { tc } = useAppCopy();
  const { data, loading, error, reload } = useInbox();
  const actions = useCronletActions();
  const navigate = useNavigate();
  if (loading) return <Skeleton title="Loading Routine Inbox" />;
  if (error) return <EmptyState title="Couldn’t load inbox" hint={error.message} />;
  return <><PageHead eyebrow={tc("inbox.eyebrow")} title={tc("inbox.title")} sub={tc("inbox.summary")} />{!data?.length ? <EmptyState title={tc("inbox.empty")} hint={tc("inbox.emptyHint")} /> : <div className="card"><div className="card-pad mono">{tc("inbox.captured", { count: data.length })}</div>{data.map((r) => <InboxRow key={r.id} req={r} onDismiss={async () => { await actions.dismissInbox(r.id); reload(); }} onMake={() => navigate(`/builder?seed=${r.id}${demoSearch().replace("?", "&")}`)} />)}</div>}</>;
}
function InboxRow({ req, onDismiss, onMake }: { req: InboxRequest; onDismiss: () => void; onMake: () => void }) { const { tc } = useAppCopy(); return <div className="inbox-row"><div className="cronlet-name"><span className="iconbox"><Inbox size={18}/></span><span><b>"{req.text}"</b><br/><span className="muted">via {req.source} · {req.capturedLabel}</span></span></div><div style={{ display: "flex", gap: 10 }}><button className="ghost-btn" onClick={onDismiss}>{tc("action.dismiss")}</button><button className="primary-btn" onClick={onMake}><Wand2 size={14}/> {tc("action.makeRoutine")}</button></div></div>; }
