import PlatformShell from "@/components/platform/PlatformShell";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell appId="hr">{children}</PlatformShell>;
}
