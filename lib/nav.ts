import {
  BarChart3,
  Bot,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Plug,
  Radar,
  Send,
  Settings,
  Sparkles,
  Target,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section?: string;
  /** Deferred-phase feature shown but marked "soon". */
  soon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Campaigns", href: "/campaigns", icon: Target },
  { label: "Work", href: "/work", icon: ListChecks },
  { label: "Ideas", href: "/content/ideas", icon: Lightbulb, section: "Content" },
  { label: "Writing Agents", href: "/agents", icon: Bot, section: "Content" },
  { label: "Generated Content", href: "/generated", icon: Sparkles, section: "Content" },
  { label: "Film Sessions", href: "/film-session", icon: Clapperboard, section: "Content" },
  { label: "Assets", href: "/content/assets", icon: FolderOpen, section: "Content" },
  { label: "Approvals", href: "/content/approvals", icon: CheckCircle2, section: "Content" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Publishing", href: "/publishing", icon: Send },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Intelligence", href: "/intelligence", icon: Radar },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Playbooks", href: "/playbooks", icon: BookOpen },
  { label: "Team", href: "/team", icon: UserCog },
  { label: "Integrations", href: "/integrations", icon: Plug, section: "Settings" },
  { label: "Settings", href: "/settings", icon: Settings },
];
