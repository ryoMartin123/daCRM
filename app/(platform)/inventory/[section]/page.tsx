"use client";

import { useParams } from "next/navigation";
import SectionPlaceholder from "@/components/platform/SectionPlaceholder";
import InventoryItems from "@/components/inventory/InventoryItems";

export default function InventorySection() {
  const slug = String(useParams()?.section ?? "");
  if (slug === "items") return <InventoryItems />;
  return <SectionPlaceholder appId="inventory" />;
}
