import PlatformShell from "@/components/platform/PlatformShell";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell appId="inventory">{children}</PlatformShell>;
}
