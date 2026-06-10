import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AccountSurface } from "./surfaces/AccountSurface";
import { BuilderSurface } from "./surfaces/BuilderSurface";
import { CronletDetailSurface } from "./surfaces/CronletDetailSurface";
import { InboxSurface } from "./surfaces/InboxSurface";
import { RunConsoleSurface } from "./surfaces/RunConsoleSurface";
import { WeeklyReviewSurface } from "./surfaces/WeeklyReviewSurface";
import { AppShell } from "./shell/AppShell";
import { RouteNotFound } from "./shell/RouteNotFound";

type AppProps = { demoMode: boolean };

export function App({ demoMode }: AppProps) {
  return (
    <BrowserRouter>
      <AppShell demoMode={demoMode}>
        <Routes>
          <Route path="/" element={<RunConsoleSurface />} />
          <Route path="/cronlets/:id" element={<CronletDetailSurface />} />
          <Route path="/builder" element={<BuilderSurface />} />
          <Route path="/inbox" element={<InboxSurface />} />
          <Route path="/review" element={<WeeklyReviewSurface />} />
          <Route path="/account" element={<AccountSurface />} />
          <Route path="*" element={<RouteNotFound demoMode={demoMode} />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
