import PlatformShell from "@/components/platform/PlatformShell";

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell appId="documents">{children}</PlatformShell>;
}
