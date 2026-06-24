"use client";

// ─── Admin → Users & Access ───────────────────────────────
// One section, two views — kept deliberately flat:
//   • Directory     — manage individual login accounts (roles, scope, app access)
//   • Access Matrix — audit who can open which apps (By User / By Role / By App)
// App Access is NOT a first-level tab here; basic per-user access shows inline in
// the Directory, and the full audit lives in the Matrix. A user row opens the
// detail drawer. Deep links: ?view=matrix (or legacy ?tab=access) opens the
// Matrix; ?user=<id> opens that user in the drawer. All state is local/mock.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Users, AppWindow } from "lucide-react";
import { usePermissions } from "@/components/providers/PermissionProvider";
import UsersDirectory from "@/components/admin/UsersDirectory";
import AppAccessMatrix from "@/components/admin/AppAccessMatrix";
import UserDetailDrawer from "@/components/admin/UserDetailDrawer";
import InviteUserWizard from "@/components/admin/InviteUserWizard";
import {
  getUsers, getUser, setUserStatus, deleteUser, type AppUser, type UserStatus,
} from "@/lib/users/data";

type View = "directory" | "matrix";

const ADMIN = "#a855f7";   // Admin app accent — used for admin buttons & tabs.

export default function UsersAccessSection() {
  const params = useSearchParams();
  const { hasFlag } = usePermissions();
  const canManage = hasFlag("users_manage");

  const [version, setVersion] = useState(0);
  // `version` is the refresh signal — re-read the store whenever it bumps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const users = useMemo(() => getUsers(), [version]);
  const refresh = () => setVersion(v => v + 1);

  const wantsMatrix = params.get("view") === "matrix" || params.get("tab") === "access";
  const [view, setView] = useState<View>(wantsMatrix ? "matrix" : "directory");
  const [editing, setEditing] = useState<AppUser | "new" | null>(null);

  // Deep links: ?user= opens that user in the Directory drawer; ?view=matrix
  // opens the Matrix. Manual changes (no param) are left untouched.
  useEffect(() => {
    const id = params.get("user");
    if (id) { const u = getUser(id); if (u) { setView("directory"); setEditing(u); } }
    else if (params.get("view") === "matrix" || params.get("tab") === "access") setView("matrix");
  }, [params]);

  function onStatus(id: string, status: UserStatus) { setUserStatus(id, status); setEditing(null); refresh(); }
  function onDelete(id: string) { deleteUser(id); setEditing(null); refresh(); }

  const VIEWS: { key: View; label: string; icon: typeof Users }[] = [
    { key: "directory", label: "Directory", icon: Users },
    { key: "matrix", label: "Access Matrix", icon: AppWindow },
  ];

  return (
    <div className="space-y-5">
      {/* Header — title (left) · centered Directory/Access Matrix toggle · Invite (right).
          Mirrors the Roles & Permissions header layout. */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Users &amp; Access</h2>
          <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
            Manage login accounts, assigned roles, scope, and app access.
          </p>
        </div>

        {/* Main segmented control — Directory / Access Matrix (centered) */}
        <div className="flex items-center rounded-lg overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
          {VIEWS.map(v => {
            const on = view === v.key;
            return (
              <button key={v.key} onClick={() => setView(v.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
                style={{ backgroundColor: on ? ADMIN : "var(--bg-surface)", color: on ? "#fff" : "var(--text-secondary)" }}>
                <v.icon className="w-3.5 h-3.5" /> {v.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex justify-end">
          {canManage && (
            <button onClick={() => setEditing("new")}
              className="flex items-center gap-1.5 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors shrink-0 hover:brightness-110" style={{ backgroundColor: ADMIN }}>
              <Plus className="w-4 h-4" /> Invite User
            </button>
          )}
        </div>
      </div>

      {view === "directory"
        ? <UsersDirectory users={users} canManage={canManage} onOpenUser={setEditing} />
        : <AppAccessMatrix embedded onOpenUser={(id) => { const u = getUser(id); if (u) setEditing(u); }} />}

      {/* Inviting a new user → guided wizard; editing an existing one → drawer. */}
      {editing === "new" && (
        <InviteUserWizard
          onClose={() => setEditing(null)}
          onCreated={() => { setEditing(null); refresh(); }}
        />
      )}
      {editing && editing !== "new" && (
        <UserDetailDrawer
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
          onRefresh={refresh}
          onStatus={onStatus}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
