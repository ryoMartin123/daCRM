"use client";

// Most My Portal sections are nav-only placeholders. The Team Workspace slices
// (meetings/action items/announcements) show the current user's own items.

import { useParams } from "next/navigation";
import SectionPlaceholder from "@/components/platform/SectionPlaceholder";
import { MyMeetings, MyActionItems, MyAnnouncements } from "@/components/portal/MyWorkspaceSections";

export default function PortalSection() {
  const slug = String(useParams()?.section ?? "");
  if (slug === "meetings") return <MyMeetings />;
  if (slug === "action-items") return <MyActionItems />;
  if (slug === "announcements") return <MyAnnouncements />;
  return <SectionPlaceholder appId="portal" />;
}
