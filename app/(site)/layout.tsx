import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

// The public marketing site. Structurally separate from the logged-in app: its
// own header/footer, no CRM/platform providers, and a forced DARK foundation
// (the data-theme="dark" wrapper drives the same token set the app uses, so the
// site stays premium-dark regardless of a visitor's app theme preference).

export const metadata: Metadata = {
  title: "Routiqa — The operating system for service businesses",
  description:
    "Routiqa runs customers, jobs, dispatch, routing, technician mobile, marketing, payments, documents, and operations in one connected platform built for service businesses.",
  openGraph: {
    title: "Routiqa — The operating system for service businesses",
    description:
      "One connected platform for CRM, dispatch, routing, technician mobile, marketing, payments, and operations.",
    siteName: "Routiqa",
    type: "website",
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
