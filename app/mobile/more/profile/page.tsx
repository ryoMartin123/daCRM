"use client";

import { useMemo } from "react";
import { Mail, Phone, Briefcase, MapPin, Calendar, BadgeCheck } from "lucide-react";
import MobileHeader from "@/components/mobile/MobileHeader";
import { Card, DetailRow, ACCENT } from "@/components/mobile/ui";
import { getCurrentTech } from "@/lib/mobile/data";

export default function ProfilePage() {
  const me = useMemo(() => getCurrentTech(), []);
  const role = me?.assignments?.[0]?.role?.replace(/_/g, " ") ?? "Field user";

  return (
    <div>
      <MobileHeader title="Profile" back />
      <div className="px-4 space-y-5">
        <Card className="p-5 flex flex-col items-center text-center">
          <span className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3" style={{ backgroundColor: ACCENT }}>{me?.initials}</span>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{me?.fullName}</p>
          <p className="text-sm capitalize" style={{ color: "var(--text-muted)" }}>{role}</p>
        </Card>

        <Card>
          <DetailRow icon={Mail} label="Email" value={me?.email ?? "—"} />
          <DetailRow icon={Phone} label="Phone" value={me?.phone ?? "—"} />
          <DetailRow icon={Briefcase} label="Role" value={<span className="capitalize">{role}</span>} />
          <DetailRow icon={MapPin} label="Location" value="Augusta Branch" />
          <DetailRow icon={Calendar} label="Started" value={me?.createdAt ? new Date(me.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"} />
          <DetailRow icon={BadgeCheck} label="Status" value={<span className="capitalize">{me?.status ?? "active"}</span>} />
        </Card>
      </div>
    </div>
  );
}
