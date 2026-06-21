"use client";

import { Building2 } from "lucide-react";
import { CompaniesSection, LocationsSection, ServiceAreasSection } from "@/components/admin/structure";
import { PageHeader } from "@/components/platform/ui";

// Companies, locations, and service areas live in Admin because CRM, HR,
// Accounting, and Documents all use them as shared context.
export default function AdminCompaniesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      <PageHeader title="Companies & Locations" subtitle="The business structure shared across every app." accent="#a855f7" icon={Building2} />
      <CompaniesSection />
      <LocationsSection />
      <ServiceAreasSection />
    </div>
  );
}
