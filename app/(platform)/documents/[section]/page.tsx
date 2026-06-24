"use client";

import { useParams } from "next/navigation";
import SectionPlaceholder from "@/components/platform/SectionPlaceholder";
import DocumentsExplorer from "@/components/platform/DocumentsExplorer";

export default function DocumentsSection() {
  const slug = String(useParams()?.section ?? "");
  if (slug === "library") return <div className="h-full"><DocumentsExplorer /></div>;
  return <SectionPlaceholder appId="documents" />;
}
