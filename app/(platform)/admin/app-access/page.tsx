"use client";

import { AppWindow } from "lucide-react";
import { PageHeader, FeaturePlaceholder } from "@/components/platform/ui";

export default function AdminAppAccessPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="App Access" subtitle="Control which apps each role and user can open." accent="#a855f7" icon={AppWindow} />
      <FeaturePlaceholder
        title="App access matrix"
        subtitle="My Portal is always granted; every other app is permission-based and determines which cards appear in the app launcher."
        features={["My Portal — always on", "CRM", "HR", "Accounting", "Documents", "Admin"]}
      />
    </div>
  );
}
