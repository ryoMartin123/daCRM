"use client";

import { Puzzle } from "lucide-react";
import { PageHeader, FeaturePlaceholder } from "@/components/platform/ui";

export default function AdminIntegrationsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Integrations" subtitle="Admin owns the connection; each app owns how it uses it." accent="#a855f7" icon={Puzzle} />
      <FeaturePlaceholder
        title="Platform connections"
        subtitle="Connect a provider once here; CRM, HR, and Accounting then decide how to use it (e.g. Admin connects Twilio, CRM uses it for appointment reminders)."
        features={["Google Workspace", "Microsoft 365", "Stripe", "QuickBooks", "Zapier", "Twilio", "Email provider", "AI settings (later)"]}
      />
    </div>
  );
}
