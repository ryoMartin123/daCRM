import PlatformShell from "@/components/platform/PlatformShell";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell appId="marketing">{children}</PlatformShell>;
}
