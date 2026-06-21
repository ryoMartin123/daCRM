import PlatformShell from "@/components/platform/PlatformShell";

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell appId="accounting">{children}</PlatformShell>;
}
