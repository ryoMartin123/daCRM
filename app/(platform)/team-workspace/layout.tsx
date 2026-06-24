import PlatformShell from "@/components/platform/PlatformShell";

export default function TeamWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell appId="team_workspace">{children}</PlatformShell>;
}
