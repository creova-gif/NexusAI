import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutGrid, AlertTriangle, Network, Users, Shield, FileText,
  TrendingUp, Laptop, Activity, Settings as SettingsIcon,
  Bell, User, MoreHorizontal, Search, LogOut,
  UserSquare2, Newspaper, Building2, Send,
  Bot, Bitcoin, Share2, ScanFace, Play,
  MessageSquare, Workflow, ClipboardCheck
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  role?: string;
  userName?: string;
  userInitials?: string;
  userRole?: string;
  pageTitle?: string;
  breadcrumb?: string;
}

interface NavLink {
  id: string;
  label: string;
  icon: typeof LayoutGrid;
  badge?: { text: string; color: "red" | "purple" | "green" | "amber" };
  path?: string;
}

export default function DashboardLayout({
  children,
  role = "Compliance Officer",
  userName = "Marie Chen",
  userInitials = "MC",
  userRole = "Sr. Compliance Officer",
  pageTitle = "Dashboard",
  breadcrumb = "Overview",
}: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("Today");

  const navLinks: NavLink[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid, path: "/dashboard" },
    { id: "alerts", label: "AML Alerts", icon: AlertTriangle, badge: { text: "7", color: "red" }, path: "/alerts" },
    { id: "network", label: "Network Graph", icon: Network, path: "/network" },
    { id: "kyc", label: "Perpetual KYC", icon: Users, badge: { text: "3", color: "amber" }, path: "/kyc" },
    { id: "sanctions", label: "Sanctions Screening", icon: Shield, path: "/sanctions" },
    { id: "sar", label: "SAR Generator", icon: FileText, badge: { text: "2", color: "purple" }, path: "/sar" },
    { id: "advisory", label: "Financial Advisory", icon: TrendingUp, path: "/advisory" },
    { id: "openbanking", label: "Open Banking", icon: Laptop, badge: { text: "NEW", color: "green" }, path: "/openbanking" },
    { id: "audit", label: "Audit Trail", icon: Activity, path: "/audit" },
    { id: "admin", label: "System Health", icon: SettingsIcon, path: "/admin" },
  ];

  const enterpriseLinks: NavLink[] = [
    { id: "risk-profile", label: "Risk Profile (XAI)", icon: UserSquare2, path: "/risk-profile" },
    { id: "screening", label: "Adverse Media", icon: Newspaper, path: "/screening" },
    { id: "ubo", label: "UBO Discovery", icon: Building2, path: "/ubo" },
    { id: "reporting", label: "Regulatory Hub", icon: Send, path: "/reporting" },
  ];

  const nextGenLinks: NavLink[] = [
    { id: "agent", label: "Agentic Investigator", icon: Bot, path: "/agent", badge: { text: "AI", color: "purple" } },
    { id: "crypto-graph", label: "Crypto Forensics", icon: Bitcoin, path: "/crypto-graph" },
    { id: "federated", label: "Federated Learning", icon: Share2, path: "/federated" },
    { id: "deepfake", label: "Deepfake Detection", icon: ScanFace, path: "/deepfake", badge: { text: "NEW", color: "green" } },
    { id: "tour", label: "Product Tour", icon: Play, path: "/tour", badge: { text: "TOUR", color: "purple" } },
  ];

  const operationsLinks: NavLink[] = [
    { id: "comms", label: "Comm Hub", icon: MessageSquare, path: "/comms" },
    { id: "workflow-builder", label: "Workflow Builder", icon: Workflow, path: "/workflow-builder" },
    { id: "qa-checker", label: "Maker-Checker QA", icon: ClipboardCheck, path: "/qa-checker" },
  ];

  const coreLinks = navLinks.slice(0, 6);
  const moduleLinks = navLinks.slice(6);

  const getBadgeColor = (color: string) => {
    switch (color) {
      case "red": return "bg-[rgba(248,113,113,.15)] text-[var(--coral)]";
      case "purple": return "bg-[var(--brand-g)] text-[var(--brand-hi)]";
      case "green": return "bg-[var(--teal-g)] text-[var(--teal)]";
      case "amber": return "bg-[var(--amber-g)] text-[var(--amber)]";
      default: return "";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* SIDEBAR */}
      <div className="w-[220px] flex-shrink-0 h-screen overflow-y-auto bg-[var(--bg1)] border-r-[0.5px] border-[var(--border)] flex flex-col relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b-[0.5px] border-[var(--border)]" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="w-7 h-7 rounded-lg flex-shrink-0 gradient-purple flex items-center justify-center glow-purple">
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="rgba(5,4,15,.8)"/>
              <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="rgba(5,4,15,.5)"/>
              <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="rgba(5,4,15,.5)"/>
              <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="rgba(5,4,15,.8)"/>
            </svg>
          </div>
          <span className="font-['Instrument_Serif'] text-[1.05rem] text-white">
            Nexus<b className="text-[var(--brand-hi)]">AI</b>
          </span>
        </div>

        {/* Role Badge */}
        <div className="mx-3.5 mt-3 mb-2 px-3 py-2 bg-[var(--brand-glow2)] border-[0.5px] border-[var(--border-purple)] rounded-md flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-hi)] flex-shrink-0 animate-pulse" style={{ boxShadow: "0 0 0 3px rgba(139,92,246,.2)" }} />
          <span className="font-['Geist_Mono'] text-[0.68rem] font-semibold text-[var(--brand-hi)] tracking-wider">{role}</span>
        </div>

        {/* Navigation - Core */}
        <div className="mt-1">
          <div className="font-['Geist_Mono'] text-[0.58rem] font-bold tracking-widest uppercase text-[var(--text-purple-3)] px-3.5 py-2 mt-1">
            CORE
          </div>
          {coreLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.path || (link.id === "overview" && location === "/");
            return (
              <div
                key={link.id}
                className={`flex items-center gap-2.5 px-3.5 py-2 mx-1.5 rounded-lg text-sm cursor-pointer transition-all relative ${
                  isActive
                    ? "bg-[var(--brand-glow)] text-[var(--brand-hi)]"
                    : "text-[var(--text-purple-2)] hover:bg-[var(--glass2)] hover:text-[var(--text-purple)]"
                }`}
                onClick={() => link.path && navigate(link.path)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[65%] bg-[var(--brand-hi)] rounded-r" />
                )}
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-65"}`} />
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold font-['Geist_Mono'] ${getBadgeColor(link.badge.color)}`}>
                    {link.badge.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation - Modules */}
        <div className="mt-1">
          <div className="font-['Geist_Mono'] text-[0.58rem] font-bold tracking-widest uppercase text-[var(--text-purple-3)] px-3.5 py-2 mt-1">
            MODULES
          </div>
          {moduleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.path;
            return (
              <div
                key={link.id}
                className={`flex items-center gap-2.5 px-3.5 py-2 mx-1.5 rounded-lg text-sm cursor-pointer transition-all relative ${
                  isActive
                    ? "bg-[var(--brand-glow)] text-[var(--brand-hi)]"
                    : "text-[var(--text-purple-2)] hover:bg-[var(--glass2)] hover:text-[var(--text-purple)]"
                }`}
                onClick={() => link.path && navigate(link.path)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[65%] bg-[var(--brand-hi)] rounded-r" />
                )}
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-65"}`} />
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold font-['Geist_Mono'] ${getBadgeColor(link.badge.color)}`}>
                    {link.badge.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation - Enterprise */}
        <div className="mt-1">
          <div className="font-['Geist_Mono'] text-[0.58rem] font-bold tracking-widest uppercase px-3.5 py-2 mt-1" style={{ color: "var(--brand-hi)", opacity: 0.7 }}>
            ENTERPRISE
          </div>
          {enterpriseLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.path;
            return (
              <div
                key={link.id}
                className={`flex items-center gap-2.5 px-3.5 py-2 mx-1.5 rounded-lg text-sm cursor-pointer transition-all relative ${
                  isActive
                    ? "bg-[var(--brand-glow)] text-[var(--brand-hi)]"
                    : "text-[var(--text-purple-2)] hover:bg-[var(--glass2)] hover:text-[var(--text-purple)]"
                }`}
                onClick={() => link.path && navigate(link.path)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[65%] bg-[var(--brand-hi)] rounded-r" />
                )}
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-65"}`} />
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold font-['Geist_Mono'] ${getBadgeColor(link.badge.color)}`}>
                    {link.badge.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation - Operations */}
        <div className="mt-1">
          <div className="font-['Geist_Mono'] text-[0.58rem] font-bold tracking-widest uppercase px-3.5 py-2 mt-1" style={{ color: "var(--sky)", opacity: 0.8 }}>
            OPERATIONS
          </div>
          {operationsLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.path;
            return (
              <div
                key={link.id}
                className={`flex items-center gap-2.5 px-3.5 py-2 mx-1.5 rounded-lg text-sm cursor-pointer transition-all relative ${
                  isActive
                    ? "bg-[var(--brand-glow)] text-[var(--brand-hi)]"
                    : "text-[var(--text-purple-2)] hover:bg-[var(--glass2)] hover:text-[var(--text-purple)]"
                }`}
                onClick={() => link.path && navigate(link.path)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[65%] bg-[var(--brand-hi)] rounded-r" />
                )}
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-65"}`} />
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold font-['Geist_Mono'] ${getBadgeColor(link.badge.color)}`}>
                    {link.badge.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation - Next Gen */}
        <div className="mt-1">
          <div className="font-['Geist_Mono'] text-[0.58rem] font-bold tracking-widest uppercase px-3.5 py-2 mt-1" style={{ color: "var(--teal)", opacity: 0.8 }}>
            NEXT GEN
          </div>
          {nextGenLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.path;
            return (
              <div
                key={link.id}
                className={`flex items-center gap-2.5 px-3.5 py-2 mx-1.5 rounded-lg text-sm cursor-pointer transition-all relative ${
                  isActive
                    ? "bg-[var(--brand-glow)] text-[var(--brand-hi)]"
                    : "text-[var(--text-purple-2)] hover:bg-[var(--glass2)] hover:text-[var(--text-purple)]"
                }`}
                onClick={() => link.path && navigate(link.path)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[65%] bg-[var(--brand-hi)] rounded-r" />
                )}
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-65"}`} />
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold font-['Geist_Mono'] ${getBadgeColor(link.badge.color)}`}>
                    {link.badge.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* User Section */}
        <div className="mt-auto px-3.5 py-3.5 border-t-[0.5px] border-[var(--border)] flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-full flex-shrink-0 gradient-purple flex items-center justify-center text-[0.72rem] font-bold text-white">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.78rem] font-semibold text-[var(--text-purple)] truncate">{userName}</div>
            <div className="text-[0.65rem] text-[var(--text-purple-3)] truncate">{userRole}</div>
          </div>
          <button className="w-[26px] h-[26px] rounded-md glass-2 border-[0.5px] border-[var(--border)] flex items-center justify-center hover:glass-3 transition-all" onClick={() => navigate("/")}>
            <LogOut className="w-3 h-3 opacity-50" />
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* TOPBAR */}
        <div className="h-[54px] flex-shrink-0 flex items-center justify-between px-6 glass-2 border-b-[0.5px] border-[var(--border)] relative z-[5]" style={{ backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-4">
            <div>
              <div className="font-['Instrument_Serif'] text-[1.1rem] text-white">{pageTitle}</div>
              <div className="font-['Geist_Mono'] text-[0.7rem] text-[var(--text-purple-3)] flex items-center gap-1">
                NexusAI <span className="text-[var(--text-purple-2)]">›</span> <span className="text-[var(--text-purple-2)]">{breadcrumb}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 glass border-[0.5px] border-[var(--border)] rounded-lg px-3 py-1.5 w-[220px] focus-within:border-[var(--border-purple)]">
            <Search className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
            <input
              type="text"
              placeholder="Search alerts, entities, SARs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-[0.78rem] text-[var(--text-purple)] placeholder:text-[var(--text-purple-3)] outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Period Filter */}
            <div className="flex gap-1 glass border-[0.5px] border-[var(--border)] rounded-lg p-0.5">
              {["Today", "7D", "30D", "90D"].map((period) => (
                <button
                  key={period}
                  onClick={() => setPeriodFilter(period)}
                  className={`px-3 py-1.5 text-[0.72rem] font-medium rounded-md transition-all ${
                    periodFilter === period
                      ? "bg-[var(--brand)] text-white font-semibold"
                      : "text-[var(--text-purple-2)] hover:bg-[var(--glass3)] hover:text-[var(--text-purple)]"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <button className="w-8 h-8 rounded-lg glass border-[0.5px] border-[var(--border)] flex items-center justify-center hover:glass-2 hover:border-[var(--border2)] transition-all relative">
              <Bell className="w-[15px] h-[15px] opacity-60" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--coral)] border-[1.5px] border-[var(--bg1)]" />
            </button>

            <button className="w-8 h-8 rounded-lg glass border-[0.5px] border-[var(--border)] flex items-center justify-center hover:glass-2 hover:border-[var(--border2)] transition-all">
              <User className="w-[15px] h-[15px] opacity-60" />
            </button>

            <button className="w-8 h-8 rounded-lg glass border-[0.5px] border-[var(--border)] flex items-center justify-center hover:glass-2 hover:border-[var(--border2)] transition-all">
              <MoreHorizontal className="w-[15px] h-[15px] opacity-60" />
            </button>
          </div>
        </div>

        {/* SCROLL AREA */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
