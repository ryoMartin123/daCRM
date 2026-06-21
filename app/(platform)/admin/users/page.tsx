import UsersSection from "@/components/settings/UsersSection";

// Platform user management — login accounts, role assignments, status.
// (Employee/person records live in the HR app; this is access, not HR data.)
export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <UsersSection />
    </div>
  );
}
