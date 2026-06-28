"use client";

// Team Workspace nav-only sections render a placeholder for now. Live Meetings
// gets a tailored note (native meeting rooms come later); the rest fall back to
// the shared "coming soon" panel titled from the nav config.

import { useParams } from "next/navigation";
import { ComingSoon } from "@/components/platform/ui";
import { sectionLabel } from "@/lib/platform/nav";
import ChannelsWorkspace from "@/components/team-workspace/ChannelsWorkspace";
import ChannelSettings from "@/components/team-workspace/ChannelSettings";
import TeamCalendar from "@/components/team-workspace/TeamCalendar";
import SharedBoards from "@/components/team-workspace/SharedBoards";

export default function TeamWorkspaceSection() {
  const params = useParams();
  const slug = String(params?.section ?? "");

  if (slug === "channels") {
    return <div className="h-full"><ChannelsWorkspace /></div>;
  }

  if (slug === "calendar") {
    return <TeamCalendar />;
  }

  if (slug === "boards") {
    return <div className="h-full"><SharedBoards /></div>;
  }

  if (slug === "settings") {
    return <ChannelSettings />;
  }

  if (slug === "live-meetings") {
    return (
      <ComingSoon
        title="Live Meetings"
        note="Live meeting integrations and native meeting rooms will be added later. For now, create meeting records, agendas, notes, and action items under Meetings."
      />
    );
  }

  const label = sectionLabel("team_workspace", slug) ?? slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return <ComingSoon title={label} />;
}
