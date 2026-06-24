"use client";

import { useParams } from "next/navigation";
import SectionPlaceholder from "@/components/platform/SectionPlaceholder";
import InventoryItems from "@/components/inventory/InventoryItems";
import Vendors from "@/components/inventory/Vendors";
import Subcontractors from "@/components/inventory/Subcontractors";
import PurchaseOrders from "@/components/inventory/PurchaseOrders";

export default function InventorySection() {
  const slug = String(useParams()?.section ?? "");
  if (slug === "items") return <InventoryItems />;
  if (slug === "vendors") return <Vendors />;
  if (slug === "subcontractors") return <Subcontractors />;
  if (slug === "purchase-orders") return <PurchaseOrders />;
  return <SectionPlaceholder appId="inventory" />;
}
