"use client";

import { KeyRound } from "lucide-react";
import { PageHeader, FeaturePlaceholder } from "@/components/platform/ui";

export default function AdminSecurityPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Security" subtitle="Platform-wide security and access policies." accent="#a855f7" icon={KeyRound} />
      <FeaturePlaceholder
        title="Security controls"
        features={["Two-factor authentication", "Password policy", "Session timeout", "Login history", "Device / session management", "Allowed domains (later)", "SSO (later)", "Security audit settings"]}
      />
    </div>
  );
}
