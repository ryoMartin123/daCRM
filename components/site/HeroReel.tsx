"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Headset,
  LineChart,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Receipt,
  Route,
  Search,
  Send,
  Smartphone,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Wordmark from "@/components/site/Wordmark";

const LOOP = 20000;

type SceneId = 0 | 1 | 2 | 3;

interface Beat {
  t: number;
  scene: SceneId;
  step: number;
  cx: number;
  cy: number;
  click?: boolean;
  url: string;
  label: string;
  note: string;
}

const BEATS: Beat[] = [
  {
    t: 0,
    scene: 0,
    step: 0,
    cx: 45,
    cy: 20,
    url: "app.routiqa.com/customers/atlas-plaza",
    label: "CRM",
    note: "Open the account record",
  },
  {
    t: 750,
    scene: 0,
    step: 1,
    cx: 27,
    cy: 34,
    click: true,
    url: "app.routiqa.com/customers/atlas-plaza",
    label: "CRM",
    note: "Review customer, contact, property, and history",
  },
  {
    t: 2100,
    scene: 0,
    step: 2,
    cx: 82,
    cy: 25,
    click: true,
    url: "app.routiqa.com/customers/atlas-plaza",
    label: "CRM",
    note: "Create a job from the customer profile",
  },
  {
    t: 3500,
    scene: 0,
    step: 3,
    cx: 76,
    cy: 72,
    url: "app.routiqa.com/jobs/job-2041",
    label: "Job",
    note: "Work order and estimate stay attached",
  },
  {
    t: 5000,
    scene: 1,
    step: 0,
    cx: 20,
    cy: 55,
    url: "app.routiqa.com/dispatching",
    label: "Dispatch",
    note: "Unscheduled work lands in the queue",
  },
  {
    t: 5850,
    scene: 1,
    step: 1,
    cx: 22,
    cy: 56,
    click: true,
    url: "app.routiqa.com/dispatching",
    label: "Dispatch",
    note: "Drag the job from queue",
  },
  {
    t: 7000,
    scene: 1,
    step: 2,
    cx: 57,
    cy: 50,
    url: "app.routiqa.com/dispatching",
    label: "Dispatch",
    note: "Drop it on Dana's board",
  },
  {
    t: 8200,
    scene: 1,
    step: 3,
    cx: 74,
    cy: 60,
    click: true,
    url: "app.routiqa.com/dispatching",
    label: "Dispatch",
    note: "Route, technician, and notifications update",
  },
  {
    t: 10000,
    scene: 2,
    step: 0,
    cx: 52,
    cy: 76,
    url: "app.routiqa.com/mobile/jobs/job-2041",
    label: "Mobile",
    note: "Technician sees the next action",
  },
  {
    t: 10800,
    scene: 2,
    step: 1,
    cx: 52,
    cy: 78,
    click: true,
    url: "app.routiqa.com/mobile/navigate/job-2041",
    label: "Route",
    note: "Start Route moves the job to En Route",
  },
  {
    t: 12150,
    scene: 2,
    step: 2,
    cx: 62,
    cy: 52,
    click: true,
    url: "app.routiqa.com/mobile/jobs/job-2041",
    label: "Work Order",
    note: "Capture photos and checklist progress",
  },
  {
    t: 13600,
    scene: 2,
    step: 3,
    cx: 50,
    cy: 79,
    click: true,
    url: "app.routiqa.com/mobile/jobs/job-2041",
    label: "Complete",
    note: "Complete job with sign-off and materials",
  },
  {
    t: 15000,
    scene: 3,
    step: 0,
    cx: 38,
    cy: 44,
    url: "app.routiqa.com/jobs/job-2041/invoice",
    label: "Billing",
    note: "Field work becomes invoice-ready",
  },
  {
    t: 15850,
    scene: 3,
    step: 1,
    cx: 72,
    cy: 63,
    click: true,
    url: "app.routiqa.com/invoices/inv-2041",
    label: "Invoice",
    note: "Line items flow into billing",
  },
  {
    t: 17100,
    scene: 3,
    step: 2,
    cx: 81,
    cy: 23,
    click: true,
    url: "app.routiqa.com/invoices/inv-2041",
    label: "Send",
    note: "Send invoice and review request",
  },
  {
    t: 18400,
    scene: 3,
    step: 3,
    cx: 50,
    cy: 50,
    url: "app.routiqa.com/analytics",
    label: "Analytics",
    note: "Dashboard updates automatically",
  },
];

const FULL_STEP: Record<SceneId, number> = { 0: 3, 1: 3, 2: 3, 3: 3 };

const TABS: { label: string; icon: LucideIcon }[] = [
  { label: "CRM", icon: Headset },
  { label: "Dispatch", icon: Truck },
  { label: "Mobile", icon: Smartphone },
  { label: "Billing", icon: Receipt },
];

export default function HeroReel() {
  const [beatIndex, setBeatIndex] = useState(0);
  const [clickKey, setClickKey] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    let last = -1;

    const loop = (now: number) => {
      const elapsed = (now - start) % LOOP;
      let next = 0;
      for (let i = 0; i < BEATS.length; i++) {
        if (BEATS[i].t <= elapsed) next = i;
        else break;
      }
      if (next !== last) {
        last = next;
        setBeatIndex(next);
        if (BEATS[next].click) setClickKey((key) => key + 1);
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const beat = BEATS[beatIndex];
  const stepFor = (scene: SceneId) =>
    scene < beat.scene ? FULL_STEP[scene] : scene === beat.scene ? beat.step : 0;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl select-none"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 40px 100px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2 px-3.5 h-10 border-b" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        <span className="hidden sm:inline-flex"><Wordmark markSize={20} /></span>
        <span className="inline-flex sm:hidden w-5 h-5 rounded-md items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: "#4f46e5" }}>R</span>
        <span className="flex gap-1.5 ml-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
        </span>
        <span className="ml-auto min-w-0 max-w-[58%] sm:max-w-none px-3 h-6 rounded-md text-[10px] sm:text-[11px] flex items-center gap-1.5 truncate" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#22c55e" }} />
          <span className="truncate">{beat.url}</span>
        </span>
      </div>

      <div className="flex items-center gap-1 px-2 py-1.5 border-b overflow-x-auto" style={{ borderColor: "var(--border-subtle)" }}>
        {TABS.map((tab, index) => {
          const Icon = tab.icon;
          const active = beat.scene === index;
          return (
            <span
              key={tab.label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              style={active ? { backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text-strong)" } : { color: "var(--text-muted)" }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </span>
          );
        })}
        <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium" style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-input)" }}>
          <Clock className="w-3.5 h-3.5" />
          20 sec workflow
        </span>
      </div>

      <div className="relative overflow-hidden" style={{ height: 430, backgroundColor: "var(--bg-page)" }}>
        <AppShell activeNav={navForBeat(beat)}>
          <Scene active={beat.scene === 0}>
            <CrmScene step={stepFor(0)} />
          </Scene>
          <Scene active={beat.scene === 1}>
            <DispatchScene step={stepFor(1)} />
          </Scene>
          <Scene active={beat.scene === 2}>
            <MobileScene step={stepFor(2)} />
          </Scene>
          <Scene active={beat.scene === 3}>
            <BillingScene step={stepFor(3)} />
          </Scene>
        </AppShell>

        <div className="absolute left-3 right-3 bottom-3 z-20 flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
            {beat.note}
          </div>
          <div className="ml-auto flex gap-1.5">
            {[0, 1, 2, 3].map((scene) => (
              <span
                key={scene}
                className="h-1 rounded-full transition-all"
                style={{ width: beat.scene === scene ? 24 : 7, backgroundColor: beat.scene === scene ? "#4f46e5" : "var(--border)" }}
              />
            ))}
          </div>
        </div>

        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${beat.cx}%`,
            top: `${beat.cy}%`,
            transition: "left 0.7s cubic-bezier(0.4,0,0.2,1), top 0.7s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))" }} aria-hidden>
            <path d="M5 3l14 7-6 1.5L9.5 18 5 3z" fill="#fff" stroke="#111827" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span key={clickKey} className="site-ripple absolute top-0 left-0 w-8 h-8 rounded-full" style={{ backgroundColor: "rgba(79,70,229,0.5)" }} />
        </div>
      </div>
    </div>
  );
}

function navForBeat(beat: Beat): string {
  if (beat.scene === 0) return "Customers";
  if (beat.scene === 1) return "Dispatching";
  if (beat.scene === 2) return "Jobs";
  return beat.label === "Analytics" ? "Analytics" : "Invoices";
}

function Scene({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className="absolute inset-0 transition-all duration-[550ms]"
      style={{ opacity: active ? 1 : 0, transform: active ? "scale(1)" : "scale(0.985)", pointerEvents: active ? "auto" : "none" }}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

function AppShell({ activeNav, children }: { activeNav: string; children: ReactNode }) {
  const nav = [
    { label: "Dashboard", icon: LineChart },
    { label: "Dispatching", icon: Truck },
    { label: "Customers", icon: Users },
    { label: "Jobs", icon: ClipboardCheck },
    { label: "Invoices", icon: Receipt },
    { label: "Analytics", icon: LineChart },
  ];

  return (
    <div className="absolute inset-0 flex text-left">
      <aside className="hidden sm:flex w-[150px] shrink-0 flex-col border-r px-2 py-3" style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-2 px-1.5 pb-3 mb-2 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#6366f126" }}>
            <Headset className="w-4 h-4" style={{ color: "#a5b4fc" }} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--sidebar-text-active)" }}>CRM</p>
            <p className="text-[10px] truncate" style={{ color: "var(--sidebar-text)" }}>Routiqa Demo</p>
          </div>
        </div>
        <p className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--sidebar-section-label)" }}>Pinned</p>
        <div className="space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === activeNav;
            return (
              <span
                key={item.label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                style={{ backgroundColor: isActive ? "var(--sidebar-item-active)" : "transparent", color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)" }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
            );
          })}
        </div>
      </aside>
      <main className="relative flex-1 min-w-0">
        <div className="h-11 border-b flex items-center gap-2 px-3 sm:px-4" style={{ backgroundColor: "var(--topbar-bg)", borderColor: "var(--topbar-border)" }}>
          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 min-w-0 flex-1 max-w-[280px]" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] truncate">Search customers, jobs, invoices...</span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            Augusta Branch
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white" style={{ backgroundColor: "#4f46e5" }}>
            <Plus className="w-3.5 h-3.5" />
            Create
          </span>
        </div>
        <div className="absolute inset-x-0 top-11 bottom-0 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}

function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", ...style }}>
      {children}
    </div>
  );
}

function IconTile({ icon: Icon, color = "#4f46e5" }: { icon: LucideIcon; color?: string }) {
  return (
    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}1f` }}>
      <Icon className="w-4 h-4" style={{ color }} />
    </span>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: `${color}22`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function CrmScene({ step }: { step: number }) {
  return (
    <div className="h-full p-3 sm:p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Atlas Plaza Management</p>
          <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>Commercial account - 3 properties - Augusta, GA</p>
        </div>
        <div className="flex gap-1.5">
          <StatusPill label="Customer" color="#10b981" />
          <StatusPill label="Commercial" color="#f59e0b" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Card className={`lg:col-span-3 p-3 ${step >= 1 ? "site-build-in" : ""}`} style={{ opacity: step >= 1 ? undefined : 0 }}>
          <div className="flex items-start gap-3">
            <IconTile icon={Building2} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>Account snapshot</p>
                <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Customer since Jun 2026</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
                <Detail icon={Phone} label="Primary" value="Maya Chen - (706) 555-0148" />
                <Detail icon={Mail} label="Email" value="ops@atlasplaza.com" />
                <Detail icon={MapPin} label="Property" value="1220 Broad St, Augusta" />
                <Detail icon={FileText} label="Agreement" value="Quarterly maintenance" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Open work</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg text-white ${step >= 2 ? "site-build-in" : ""}`} style={{ backgroundColor: "#4f46e5", opacity: step >= 2 ? undefined : 0 }}>
              <Plus className="w-3 h-3" />
              New Job
            </span>
          </div>
          {[
            ["EST-1188", "Rooftop unit replacement", "$8,420", "Approved", "#10b981"],
            ["JOB-2041", "Replacement site visit", "$640", "New", "#6366f1"],
            ["AGR-240", "Quarterly PM agreement", "$1,260", "Active", "#0891b2"],
          ].map(([ref, title, amount, status, color], index) => {
            const show = step >= (index === 1 ? 2 : 1);
            return (
              <div
                key={ref}
                className={show ? "site-build-in" : ""}
                style={{ opacity: show ? undefined : 0, animationDelay: `${index * 90}ms`, borderTop: index ? "1px solid var(--border-subtle)" : "none" }}
              >
                <div className="grid grid-cols-[auto_1fr_auto] gap-2 px-3 py-2.5 items-center">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{ref}</span>
                  <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{title}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{amount}</span>
                </div>
                <div className="px-3 pb-2 -mt-1"><StatusPill label={status} color={color} /></div>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
        {[
          ["Open jobs", "2", ClipboardCheck, "#6366f1"],
          ["Open quotes", "$8.4k", DollarSign, "#10b981"],
          ["Next action", "Schedule", Calendar, "#f59e0b"],
          ["Files", "18", FileText, "#0891b2"],
        ].map(([label, value, Icon, color], index) => (
          <Card key={label as string} className={`${step >= 3 ? "site-build-in" : ""} px-3 py-2.5`} style={{ opacity: step >= 3 ? undefined : 0, animationDelay: `${index * 80}ms` }}>
            <div className="flex items-center gap-2">
              <IconTile icon={Icon as LucideIcon} color={color as string} />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{value as string}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{label as string}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Icon className="w-3 h-3" />{label}</p>
      <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function DispatchScene({ step }: { step: number }) {
  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-[190px_1fr] overflow-hidden">
      <div className="border-r p-3 overflow-hidden" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Queue</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>4</span>
        </div>
        <QueueCard
          title="Replacement site visit"
          who="Atlas Plaza Management"
          time="Unscheduled"
          color="#10b981"
          muted={step >= 2}
        />
        <QueueCard title="No-cool service" who="Okafor Home" time="High priority" color="#ef4444" muted={false} />
        {step >= 1 && step < 3 && (
          <div
            className="site-build-in absolute hidden md:block w-[178px] rounded-xl px-3 py-2.5 z-20"
            style={{
              left: step >= 2 ? "48%" : "190px",
              top: step >= 2 ? "44%" : "38%",
              transform: step >= 2 ? "translate(-50%, -50%)" : "none",
              transition: "left 0.9s cubic-bezier(0.22,1,0.36,1), top 0.9s cubic-bezier(0.22,1,0.36,1)",
              backgroundColor: "#10b98122",
              border: "1px solid #10b98166",
              boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Replacement site visit</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Atlas Plaza - 90 min</p>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div className="h-11 px-3 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Tuesday, Jun 30</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Hourly dispatch board</p>
          </div>
          <span className="hidden sm:inline-flex gap-1">
            {["Board", "Map", "Week"].map((label, index) => (
              <span key={label} className="px-2 py-1 rounded-md text-[10px] font-medium" style={index === 0 ? { backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text-strong)" } : { color: "var(--text-muted)" }}>{label}</span>
            ))}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px h-[calc(100%-2.75rem)]" style={{ backgroundColor: "var(--border-subtle)" }}>
          {[
            ["Marcus R.", "MR", [["8:00", "Maintenance visit", "Bristow Residence", "#6366f1"], ["10:30", "Compressor repair", "Kellerman HVAC", "#ef4444"]]],
            ["Dana W.", "DW", [["9:00", "Filter replacement", "Lindgren Bldg", "#0891b2"], ["11:00", "Replacement site visit", "Atlas Plaza", "#10b981"]]],
            ["Priya S.", "PS", [["8:30", "Install estimate", "Vance Property", "#8b5cf6"], ["1:00", "Warranty service", "Reyes Residence", "#f59e0b"]]],
          ].map(([name, initials, jobs], columnIndex) => (
            <div key={name as string} className="px-2 pt-2 overflow-hidden" style={{ backgroundColor: "var(--bg-page)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: "#4f46e5" }}>{initials as string}</span>
                <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{name as string}</span>
              </div>
              <div className="space-y-1.5">
                {(jobs as string[][]).map(([time, title, who, color], index) => {
                  const atlas = title === "Replacement site visit";
                  const show = !atlas || step >= 2;
                  return (
                    <div
                      key={title}
                      className={show ? "site-build-in" : ""}
                      style={{ opacity: show ? undefined : 0, animationDelay: atlas ? "0ms" : `${(columnIndex + index) * 70}ms` }}
                    >
                      <JobBlock time={time} title={title} who={who} color={color} active={atlas && step >= 3} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <RouteMap show={step >= 3} />
      </div>
    </div>
  );
}

function QueueCard({ title, who, time, color, muted }: { title: string; who: string; time: string; color: string; muted: boolean }) {
  return (
    <div className="rounded-xl px-3 py-2.5 mb-2 transition-opacity" style={{ opacity: muted ? 0.35 : 1, backgroundColor: `${color}1a`, borderLeft: `3px solid ${color}` }}>
      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{who}</p>
      <p className="text-[10px] mt-1 font-semibold" style={{ color }}>{time}</p>
    </div>
  );
}

function JobBlock({ time, title, who, color, active }: { time: string; title: string; who: string; color: string; active: boolean }) {
  return (
    <div className="rounded-lg px-2.5 py-1.5 overflow-hidden" style={{ minHeight: 54, backgroundColor: `${color}1f`, borderLeft: `3px solid ${color}`, boxShadow: active ? `0 0 0 1px ${color}66, 0 8px 28px -16px ${color}` : undefined }}>
      <div className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{time}</div>
      <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{title}</div>
      <div className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>{who}</div>
    </div>
  );
}

function RouteMap({ show }: { show: boolean }) {
  return (
    <div className="hidden lg:block absolute right-3 bottom-3 w-[170px] h-[116px] rounded-xl overflow-hidden site-grid-bg" style={{ opacity: show ? 1 : 0, transition: "opacity 0.35s", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 170 116" fill="none">
        <path className={show ? "site-draw" : ""} d="M27 84 C 55 44, 76 62, 95 30 S 134 44, 144 22" stroke="#10b981" strokeWidth="3" strokeDasharray="160" strokeDashoffset="160" strokeLinecap="round" />
      </svg>
      {[[25, 84, "#6366f1"], [96, 31, "#10b981"], [144, 22, "#f59e0b"]].map(([left, top, color], index) => (
        <span key={index} className="absolute w-2.5 h-2.5 rounded-full" style={{ left, top, backgroundColor: color as string, boxShadow: `0 0 0 4px ${color}33` }} />
      ))}
      <div className="absolute left-2 bottom-2 text-[10px] font-semibold" style={{ color: "var(--text-primary)" }}>Route optimized</div>
    </div>
  );
}

function MobileScene({ step }: { step: number }) {
  const checklist: { label: string; icon: LucideIcon; done: boolean }[] = [
    { label: "Before photo", icon: Camera, done: step >= 2 },
    { label: "Inspect rooftop unit", icon: Wrench, done: step >= 2 },
    { label: "Customer sign-off", icon: ClipboardCheck, done: step >= 3 },
  ];

  return (
    <div className="h-full flex items-center justify-center p-3 overflow-hidden">
      <div className="hidden md:block absolute left-5 top-6 bottom-6 w-[260px]">
        <Card className="p-4 h-full">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Live job record</p>
          <div className="space-y-3">
            {[
              ["Scheduled", "#6366f1", step >= 0],
              ["En Route", "#3b82f6", step >= 1],
              ["In Progress", "#0891b2", step >= 2],
              ["Completed", "#10b981", step >= 3],
            ].map(([label, color, done], index) => (
              <div key={label as string} className="flex items-center gap-2">
                {done ? <CheckCircle2 className="w-4 h-4" style={{ color: color as string }} /> : <Circle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                <span className="text-xs" style={{ color: done ? "var(--text-primary)" : "var(--text-muted)" }}>{label as string}</span>
                {index < 3 && <span className="ml-auto h-px w-8" style={{ backgroundColor: "var(--border-subtle)" }} />}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl p-3" style={{ backgroundColor: "var(--bg-surface-2)" }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Work order</p>
            <p className="text-sm font-semibold mt-1" style={{ color: "var(--text-primary)" }}>Replacement diagnosis</p>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-input)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${step >= 3 ? 100 : step >= 2 ? 67 : 22}%`, backgroundColor: step >= 3 ? "#10b981" : "#4f46e5" }} />
            </div>
            <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>{step >= 3 ? "Checklist complete" : step >= 2 ? "2 of 3 required steps" : "Ready for technician"}</p>
          </div>
        </Card>
      </div>

      <div className="relative rounded-[2rem] p-2 w-[245px] sm:w-[260px]" style={{ backgroundColor: "#0a0a0a", border: "1px solid var(--border)", boxShadow: "0 24px 70px -24px rgba(0,0,0,0.8)" }}>
        <div className="rounded-[1.55rem] overflow-hidden h-[356px]" style={{ backgroundColor: "var(--bg-page)" }}>
          <div className="h-7 relative">
            <span className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full" style={{ backgroundColor: "#0a0a0a" }} />
          </div>
          <div className="px-4 pb-2 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Today - next stop</p>
              <p className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>Atlas Plaza</p>
            </div>
            <StatusPill label={step >= 3 ? "Completed" : step >= 2 ? "In Progress" : step >= 1 ? "En Route" : "Scheduled"} color={step >= 3 ? "#10b981" : step >= 2 ? "#0891b2" : step >= 1 ? "#3b82f6" : "#6366f1"} />
          </div>
          <div className="px-4">
            <div className="rounded-2xl p-3 text-white" style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}>
              <p className="text-[10px] opacity-80">11:00 AM - 90 min</p>
              <p className="text-sm font-bold mt-0.5">Replacement site visit</p>
              <p className="text-[11px] opacity-90">1220 Broad St - 4.2 mi</p>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <span className="flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.16)" }}><Navigation className="w-3.5 h-3.5" /> Route</span>
                <span className="flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.16)" }}><Phone className="w-3.5 h-3.5" /> Call</span>
              </div>
            </div>
          </div>
          <div className="px-4 mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Checklist & photos</p>
            {checklist.map(({ label, icon: Icon, done }, index) => (
              <div key={label} className="flex items-center gap-2 py-2" style={{ borderTop: index ? "1px solid var(--border-subtle)" : "none" }}>
                {done ? <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} /> : <Circle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                <Icon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                <span className="text-xs" style={{ color: "var(--text-primary)" }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="absolute left-4 right-4 bottom-4">
            <div className="rounded-2xl min-h-[42px] flex items-center justify-center gap-1.5 text-sm font-bold text-white" style={{ backgroundColor: step >= 3 ? "#10b981" : "#4f46e5", boxShadow: "0 10px 28px -12px #4f46e5" }}>
              {step >= 3 ? <CheckCircle2 className="w-4 h-4" /> : step >= 1 ? <ClipboardCheck className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
              {step >= 3 ? "Completed" : step >= 2 ? "Complete Job" : step >= 1 ? "Arrived" : "Start Route"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingScene({ step }: { step: number }) {
  const stats: { label: string; value: string; icon: LucideIcon; color: string; active: boolean }[] = [
    { label: "Revenue", value: "$248.9k", icon: DollarSign, color: "#10b981", active: step >= 3 },
    { label: "Jobs done", value: "42", icon: CheckCircle2, color: "#6366f1", active: step >= 3 },
    { label: "Reviews", value: "4.9", icon: LineChart, color: "#f59e0b", active: step >= 3 },
  ];

  return (
    <div className="h-full p-3 sm:p-4 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-3 h-full">
        <Card className="overflow-hidden">
          <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
            <div className="flex items-center gap-2">
              <IconTile icon={Receipt} color="#10b981" />
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Invoice INV-2041</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>From completed job and work order</p>
              </div>
            </div>
            <StatusPill label={step >= 2 ? "Sent" : "Draft"} color={step >= 2 ? "#3b82f6" : "#6b7280"} />
          </div>
          <div className="p-3 space-y-2">
            {[
              ["Replacement diagnosis", "1", "$185"],
              ["Rooftop unit labor", "2.5", "$375"],
              ["Capacitor and materials", "1", "$80"],
            ].map(([item, qty, amount], index) => (
              <div key={item} className={`${step >= 1 ? "site-build-in" : ""} grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg px-3 py-2`} style={{ opacity: step >= 1 ? undefined : 0, animationDelay: `${index * 90}ms`, backgroundColor: "var(--bg-surface-2)" }}>
                <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{item}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>x {qty}</span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{amount}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total</span>
              <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>$640</span>
            </div>
            <div className={`${step >= 2 ? "site-build-in" : ""} flex items-center justify-end gap-2`} style={{ opacity: step >= 2 ? undefined : 0 }}>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                <CreditCard className="w-3.5 h-3.5" />
                Payment link
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "#4f46e5" }}>
                <Send className="w-3.5 h-3.5" />
                Send invoice
              </span>
            </div>
          </div>
        </Card>

        <div className="grid grid-rows-[auto_1fr] gap-3">
          <div className="grid grid-cols-3 gap-2.5">
            {stats.map(({ label, value, icon: Icon, color, active }, index) => (
              <Card key={label} className={`${active ? "site-build-in" : ""} p-3`} style={{ opacity: active ? undefined : 0.45, animationDelay: `${index * 90}ms` }}>
                <Icon className="w-4 h-4 mb-2" style={{ color }} />
                <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>{value}</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
              </Card>
            ))}
          </div>

          <Card className="p-3 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Operations analytics</p>
              <StatusPill label={step >= 3 ? "Updated" : "Waiting"} color={step >= 3 ? "#10b981" : "#6b7280"} />
            </div>
            <div className="flex items-end gap-2 h-[128px]">
              {[36, 48, 42, 66, 55, 72, 64, 86].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-md transition-all duration-700" style={{ height: step >= 3 ? `${height}%` : `${Math.max(16, height - 34)}%`, transitionDelay: `${index * 45}ms`, background: index === 7 ? "linear-gradient(180deg,#10b981,#4f46e5)" : "var(--bg-surface-2)" }} />
              ))}
            </div>
            <div className={`${step >= 3 ? "site-build-in" : ""} mt-3 rounded-lg px-3 py-2 flex items-center gap-2`} style={{ opacity: step >= 3 ? undefined : 0, backgroundColor: "var(--accent-soft-bg)", border: "1px solid var(--accent-soft-border)" }}>
              <Route className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
              <span className="text-[11px] font-medium" style={{ color: "var(--accent-text-strong)" }}>Atlas Plaza completed - invoice sent - review follow-up queued</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
