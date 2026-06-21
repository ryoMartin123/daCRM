import { PermissionProvider } from "@/components/providers/PermissionProvider";
import { HierarchyProvider } from "@/components/providers/HierarchyProvider";

// The platform route group (launcher + Portal/HR/Accounting/Documents/Admin).
// PermissionProvider = the acting user, app access, and View-as (shared with the
// CRM via localStorage). HierarchyProvider = the org → company → location context,
// so the permission-aware context selector and the Admin structure editors work
// across apps. The CRM-specific Customer/Comments providers stay scoped to the CRM.
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionProvider>
      <HierarchyProvider>{children}</HierarchyProvider>
    </PermissionProvider>
  );
}
