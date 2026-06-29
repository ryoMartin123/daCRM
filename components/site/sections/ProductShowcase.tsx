import { BrowserFrame, PhoneFrame, Eyebrow } from "@/components/site/ui";
import DispatchMockup from "@/components/site/mockups/DispatchMockup";
import MobileAppMockup from "@/components/site/mockups/MobileAppMockup";
import AutomationBuilderMockup from "@/components/site/mockups/AutomationBuilderMockup";
import AnalyticsMockup from "@/components/site/mockups/AnalyticsMockup";
import CrmMockup from "@/components/site/mockups/CrmMockup";
import { Check } from "lucide-react";

interface Item {
  id: string; eyebrow: string; title: string; body: string; bullets: string[];
  visual: React.ReactNode;
}

const ITEMS: Item[] = [
  {
    id: "crm", eyebrow: "CRM & Jobs", title: "Every customer, job, and dollar in one record",
    body: "Leads, estimates, jobs, photos, agreements, payments, and history — connected to a single customer record the whole team can see.",
    bullets: ["Lead-to-cash in one timeline", "Estimates, jobs, and invoices linked", "Property, equipment, and agreement history"],
    visual: <BrowserFrame url="app.routiqa.com/customers"><CrmMockup /></BrowserFrame>,
  },
  {
    id: "dispatch", eyebrow: "Dispatch & Routing", title: "Schedule the day and route the trucks",
    body: "A live board for drag-and-drop scheduling, a map for routing, and real-time visibility into every job and technician.",
    bullets: ["Drag-and-drop dispatch board", "Optimized multi-stop routing", "Live status across the whole day"],
    visual: <BrowserFrame url="app.routiqa.com/dispatching"><DispatchMockup /></BrowserFrame>,
  },
  {
    id: "mobile", eyebrow: "Technician Mobile", title: "A field-ready app for the team in the truck",
    body: "Technicians see their route, navigate to the next stop, capture photos and notes, and close jobs — all from their phone.",
    bullets: ["Today's route and turn-by-turn navigation", "Photos, notes, and checklists on site", "Update status and collect payment in the field"],
    visual: <div className="flex justify-center"><PhoneFrame><MobileAppMockup /></PhoneFrame></div>,
  },
  {
    id: "marketing", eyebrow: "Marketing Automation", title: "Follow-ups and campaigns that run themselves",
    body: "Turn CRM data into action: estimate follow-ups, maintenance renewals, review requests, and seasonal campaigns — automated.",
    bullets: ["Visual automation builder", "Audiences from live CRM data", "Email, SMS, and call-task sequences"],
    visual: <BrowserFrame url="app.routiqa.com/marketing/builder"><AutomationBuilderMockup /></BrowserFrame>,
  },
  {
    id: "analytics", eyebrow: "Analytics & Reporting", title: "Build the reports your business runs on",
    body: "Owner dashboards and a report builder over your real operational data — revenue, jobs, technicians, and marketing in one place.",
    bullets: ["Drag-and-drop report builder", "Operational + financial KPIs", "Per-location and per-team breakdowns"],
    visual: <BrowserFrame url="app.routiqa.com/analytics"><AnalyticsMockup /></BrowserFrame>,
  },
];

export default function ProductShowcase({ withIds = false }: { withIds?: boolean }) {
  return (
    <div>
      {ITEMS.map((item, i) => {
        const flip = i % 2 === 1;
        return (
          <section key={item.id} id={withIds ? item.id : undefined} className={`${i % 2 ? "site-grid-bg" : ""} border-b`} style={{ scrollMarginTop: "5rem" }}>
            <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 lg:py-24">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div className={flip ? "lg:order-2" : ""}>
                  <Eyebrow>{item.eyebrow}</Eyebrow>
                  <h2 className="mt-4 text-3xl lg:text-[2.4rem] font-bold tracking-tight leading-[1.12]" style={{ color: "var(--text-primary)" }}>{item.title}</h2>
                  <p className="mt-4 text-base lg:text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.body}</p>
                  <ul className="mt-6 space-y-3">
                    {item.bullets.map(b => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "var(--accent-soft-2-bg)" }}><Check className="w-3 h-3" style={{ color: "var(--accent-text-strong)" }} /></span>
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={flip ? "lg:order-1" : ""}>{item.visual}</div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
