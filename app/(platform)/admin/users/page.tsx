import { Suspense } from "react";
import UsersAccessSection from "@/components/admin/UsersAccessSection";

// Users & Access — two views in one section: the Directory (login accounts +
// role/scope/app-access) and the Access Matrix (app-access audit). (Employee/
// person records live in the HR app; this is access, not HR data.)
// Suspense boundary required because the section reads useSearchParams
// (?view=matrix / legacy ?tab=access, ?user=<id>).
export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <Suspense fallback={null}>
        <UsersAccessSection />
      </Suspense>
    </div>
  );
}
