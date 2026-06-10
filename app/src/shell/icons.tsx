import {
  AlertTriangle, Bell, Box, CalendarDays, Check, CheckCircle2, CircleGauge,
  Clock3, FileText, GitBranch, Inbox, Layers, Mail, Pause, Play, RefreshCw,
  Search, Send, Settings2, Shield, Sparkles, Terminal, TrendingUp, User, Wand2,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  pulse: Zap, calendar: CalendarDays, clock: Clock3, check: Check, checkCircle: CheckCircle2,
  alert: AlertTriangle, shield: Shield, shieldChk: Shield, link: GitBranch, file: FileText,
  fileText: FileText, play: Play, pause: Pause, bolt: Zap, refresh: RefreshCw, inbox: Inbox,
  gauge: CircleGauge, history: Clock3, terminal: Terminal, sparkle: Sparkles, wand: Wand2,
  lock: Shield, hash: Settings2, trend: TrendingUp, git: GitBranch, robot: Sparkles, send: Send,
  cube: Box, layers: Layers, user: User, flag: AlertTriangle, mail: Mail, bell: Bell,
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const Cmp = iconMap[name] ?? Sparkles;
  return <Cmp size={size} strokeWidth={1.8} />;
}

export { Bell, Check, Inbox, Search, Wand2, AlertTriangle, ChevronRight, ChevronLeft, Copy } from "lucide-react";
