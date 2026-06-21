import PlatformShell from "@/components/platform/PlatformShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell appId="admin">{children}</PlatformShell>;
}
