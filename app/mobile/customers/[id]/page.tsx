"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Phone, MessageSquare, Navigation, MapPin, Mail, Building2, Home, Users } from "lucide-react";
import MobileHeader from "@/components/mobile/MobileHeader";
import { Card, Section, DetailRow, QuickAction, JobCard, EmptyState, ACCENT } from "@/components/mobile/ui";
import { getCustomer } from "@/lib/customers/data";
import { getAllJobs } from "@/lib/jobs/data";
import { useDataVersion } from "@/lib/sync/useDataVersion";

export default function MobileCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const rev = useDataVersion();   // re-read after jobs hydrate / customer stubs seed
  const customer = useMemo(() => getCustomer(id), [id, rev]);
  const jobs = useMemo(() => (customer ? getAllJobs().filter(j => j.accountId === customer.id).slice(0, 8) : []), [customer, rev]);

  if (!customer) {
    return <div><MobileHeader title="Customer" back /><EmptyState icon={Users} title="Customer not found" /></div>;
  }
  const addr = [customer.address, customer.city, customer.state].filter(Boolean).join(", ");
  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr || customer.name)}`;

  return (
    <div>
      <MobileHeader title={customer.name} subtitle={`${customer.type} · ${customer.status}`} back />
      <div className="px-4 space-y-5">
        <Card className="p-5 flex flex-col items-center text-center">
          <span className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-2.5" style={{ backgroundColor: ACCENT }}>{customer.initials}</span>
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{customer.name}</p>
          <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            {customer.type === "Commercial" ? <Building2 className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}{customer.type} · Customer since {customer.since}
          </p>
        </Card>

        <div className="flex gap-2.5">
          <QuickAction icon={Phone} label="Call" href={customer.phone ? `tel:${customer.phone}` : undefined} />
          <QuickAction icon={MessageSquare} label="Message" href={customer.phone ? `sms:${customer.phone}` : undefined} />
          <QuickAction icon={Navigation} label="Directions" href={mapsHref} />
        </div>

        <Card>
          <DetailRow icon={Phone} label="Phone" value={customer.phone || "—"} />
          <DetailRow icon={Mail} label="Email" value={customer.email || "—"} />
          <DetailRow icon={MapPin} label="Address" value={addr || "—"} />
        </Card>

        {customer.notes && (
          <Section title="Notes"><Card className="p-4"><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{customer.notes}</p></Card></Section>
        )}

        <Section title={`Jobs (${jobs.length})`}>
          {jobs.length === 0 ? <Card className="px-4 py-5"><p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>No jobs yet.</p></Card>
            : <div className="space-y-2.5">{jobs.map(j => <JobCard key={j.id} job={j} />)}</div>}
        </Section>
      </div>
    </div>
  );
}
