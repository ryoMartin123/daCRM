import PlatformShell from "@/components/platform/PlatformShell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell appId="portal">{children}</PlatformShell>;
}
