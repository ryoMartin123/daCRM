// ─── Inventory & Procurement — mock data (pre-Supabase) ───
// What we buy/use and who supplies it: inventory items, warehouses/truck stock,
// purchase orders, vendors, and subcontractors. Static mock for the shell +
// dashboard — no persistence, calculations, or PO workflows yet. These records
// link to CRM jobs/projects and Accounting bills in a later phase.

export type VendorType =
  | "material_supplier" | "equipment_supplier" | "subcontractor"
  | "service_provider" | "utility" | "professional_service";

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  material_supplier: "Material Supplier",
  equipment_supplier: "Equipment Supplier",
  subcontractor: "Subcontractor",
  service_provider: "Service Provider",
  utility: "Utility / Vendor",
  professional_service: "Professional Service",
};

export type POStatus = "draft" | "open" | "received" | "canceled";
export const PO_STATUS_STYLE: Record<POStatus, { label: string; dot: string }> = {
  draft: { label: "Draft", dot: "#9ca3af" },
  open: { label: "Open", dot: "#f59e0b" },
  received: { label: "Received", dot: "#10b981" },
  canceled: { label: "Canceled", dot: "#9ca3af" },
};

export interface Warehouse {
  id: string;
  name: string;
  kind: "warehouse" | "office" | "branch" | "truck" | "trailer";
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  vendor?: string;             // preferred vendor
  cost?: number;
  sellPrice?: number;          // optional customer price
  unit?: string;               // each, box, ft, …
  qtyOnHand: number;
  location: string;            // warehouse/location name (a truck is a location)
  reorderPoint: number;
}

// Stock status derived from on-hand vs reorder point.
export type StockStatus = "in" | "low" | "out";
export const STOCK_STATUS_STYLE: Record<StockStatus, { label: string; dot: string }> = {
  in: { label: "In stock", dot: "#10b981" },
  low: { label: "Low stock", dot: "#f59e0b" },
  out: { label: "Out of stock", dot: "#ef4444" },
};
export function itemStock(i: InventoryItem): StockStatus {
  if (i.qtyOnHand <= 0) return "out";
  if (i.qtyOnHand <= i.reorderPoint) return "low";
  return "in";
}

export interface PurchaseOrder {
  id: string;
  number: string;
  vendor: string;
  items: number;
  total: number;
  status: POStatus;
  date: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  contact?: string;
  terms?: string;
  preferred?: boolean;
}

export interface Subcontractor {
  id: string;
  name: string;
  trade: string;
  contact?: string;
  serviceArea?: string;
  approved: boolean;
  insuranceOnFile?: boolean;
}

export interface InventoryActivity {
  id: string;
  kind: "received" | "truck_adjusted" | "po_created" | "doc_uploaded";
  text: string;
  when: string;
}

const WAREHOUSES: Warehouse[] = [
  { id: "wh-main", name: "Main Warehouse", kind: "warehouse" },
  { id: "wh-augusta", name: "Augusta Office", kind: "office" },
  { id: "wh-stapleton", name: "Stapleton Branch", kind: "branch" },
  { id: "wh-truck1", name: "Truck 1", kind: "truck" },
  { id: "wh-truck2", name: "Truck 2", kind: "truck" },
  { id: "wh-install", name: "Install Trailer", kind: "trailer" },
  { id: "wh-roofing", name: "Roofing Trailer", kind: "trailer" },
];

// Seed items (low-stock examples have qtyOnHand at/below reorderPoint).
let _items: InventoryItem[] = [
  { id: "it-wetswitch", name: "Wet Switch", sku: "HVAC-WS-01", category: "HVAC Controls", vendor: "East Coast Metal", cost: 12.5, sellPrice: 39, unit: "each", qtyOnHand: 2, location: "Main Warehouse", reorderPoint: 10 },
  { id: "it-mediafilter", name: "4-inch Media Filter", sku: "HVAC-MF-4", category: "Filters", vendor: "East Coast Metal", cost: 24, sellPrice: 59, unit: "each", qtyOnHand: 3, location: "Truck 1", reorderPoint: 12 },
  { id: "it-disconnect", name: "Disconnect", sku: "ELEC-DC-30", category: "Electrical", vendor: "Border States", cost: 18, sellPrice: 49, unit: "each", qtyOnHand: 1, location: "Main Warehouse", reorderPoint: 8 },
  { id: "it-thermostat", name: "Thermostat", sku: "HVAC-TSTAT", category: "HVAC Controls", vendor: "Carrier Supply", cost: 96, sellPrice: 249, unit: "each", qtyOnHand: 4, location: "Augusta Office", reorderPoint: 6 },
  { id: "it-pvc", name: "PVC Fittings", sku: "PLMB-PVC-AS", category: "Plumbing", vendor: "Ferguson", cost: 3.25, sellPrice: 9, unit: "each", qtyOnHand: 14, location: "Install Trailer", reorderPoint: 25 },
  { id: "it-condenser", name: "3-Ton Condenser", sku: "HVAC-COND-3T", category: "Equipment", vendor: "Carrier Supply", cost: 1850, sellPrice: 3200, unit: "each", qtyOnHand: 5, location: "Main Warehouse", reorderPoint: 2 },
  { id: "it-coil", name: "Evaporator Coil", sku: "HVAC-COIL-3T", category: "Equipment", vendor: "Carrier Supply", cost: 420, sellPrice: 820, unit: "each", qtyOnHand: 6, location: "Main Warehouse", reorderPoint: 3 },
  { id: "it-lineset", name: "Line Set 3/8 x 3/4", sku: "HVAC-LS-3834", category: "Refrigeration", vendor: "East Coast Metal", cost: 68, sellPrice: 140, unit: "each", qtyOnHand: 0, location: "Truck 2", reorderPoint: 4 },
  { id: "it-whip", name: "Whip / Flex Conduit", sku: "ELEC-WHIP-6", category: "Electrical", vendor: "Border States", cost: 9.5, sellPrice: 24, unit: "each", qtyOnHand: 22, location: "Stapleton Branch", reorderPoint: 10 },
  { id: "it-drainpan", name: "Condensate Drain Pan", sku: "HVAC-PAN-AS", category: "HVAC Controls", vendor: "Ferguson", cost: 16, sellPrice: 45, unit: "each", qtyOnHand: 9, location: "Truck 1", reorderPoint: 6 },
  { id: "it-shingles", name: "Architectural Shingles", sku: "ROOF-SHG-AR", category: "Roofing", vendor: "ABC Supply", cost: 32, sellPrice: 0, unit: "bundle", qtyOnHand: 40, location: "Roofing Trailer", reorderPoint: 30 },
];

const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "po-ecm", number: "PO-1042", vendor: "East Coast Metal", items: 8, total: 1240, status: "open", date: "Jun 21, 2026" },
  { id: "po-hvac", number: "PO-1043", vendor: "Carrier Supply", items: 3, total: 9850, status: "open", date: "Jun 20, 2026" },
  { id: "po-roof", number: "PO-1044", vendor: "ABC Supply", items: 12, total: 4360, status: "draft", date: "Jun 19, 2026" },
];

const VENDORS: Vendor[] = [
  { id: "v-ecm", name: "East Coast Metal", type: "material_supplier", contact: "orders@ecmetal.com", terms: "Net 30", preferred: true },
  { id: "v-carrier", name: "Carrier Supply", type: "equipment_supplier", contact: "(706) 555-0190", terms: "Net 30", preferred: true },
  { id: "v-ferguson", name: "Ferguson", type: "material_supplier", contact: "(706) 555-0142", terms: "Net 15" },
  { id: "v-abc", name: "ABC Supply", type: "material_supplier", contact: "(706) 555-0177", terms: "Net 30" },
  { id: "v-border", name: "Border States", type: "equipment_supplier", contact: "(706) 555-0133", terms: "Net 30" },
];

const SUBCONTRACTORS: Subcontractor[] = [
  { id: "sub-elec", name: "Bright Spark Electric", trade: "Electrician", contact: "(706) 555-0211", serviceArea: "Augusta", approved: true, insuranceOnFile: true },
  { id: "sub-roof", name: "Summit Roofing Co.", trade: "Roofer", contact: "(706) 555-0222", serviceArea: "CSRA", approved: true, insuranceOnFile: true },
  { id: "sub-drywall", name: "Clean Line Drywall", trade: "Drywall contractor", contact: "(706) 555-0233", serviceArea: "Augusta", approved: false, insuranceOnFile: false },
  { id: "sub-duct", name: "AirFlow Ductwork", trade: "Ductwork subcontractor", contact: "(706) 555-0244", serviceArea: "Evans", approved: true, insuranceOnFile: true },
  { id: "sub-crane", name: "Lift-It Crane Services", trade: "Crane company", contact: "(706) 555-0255", serviceArea: "Regional", approved: true, insuranceOnFile: false },
];

const ACTIVITY: InventoryActivity[] = [
  { id: "act-1", kind: "received", text: "Received 8 items on PO-1042 — East Coast Metal", when: "2 hours ago" },
  { id: "act-2", kind: "truck_adjusted", text: "Truck 1 stock adjusted — 4 Media Filters used", when: "Yesterday" },
  { id: "act-3", kind: "po_created", text: "Purchase order PO-1044 created — ABC Supply", when: "Jun 19, 2026" },
  { id: "act-4", kind: "doc_uploaded", text: "Insurance certificate uploaded — Summit Roofing Co.", when: "Jun 18, 2026" },
];

export function getWarehouses(): Warehouse[] { return WAREHOUSES; }
export function getInventoryItems(): InventoryItem[] { return _items; }
export function getInventoryItem(id: string): InventoryItem | undefined { return _items.find(i => i.id === id); }
export function getLowStockItems(): InventoryItem[] { return _items.filter(i => i.qtyOnHand <= i.reorderPoint); }
export function getItemCategories(): string[] { return [...new Set(_items.map(i => i.category))].sort(); }
export function inventoryValue(): number { return _items.reduce((s, i) => s + (i.cost ?? 0) * i.qtyOnHand, 0); }

// ─── Item mutations (in-memory; callers refresh via a local tick) ──
function iid(): string { return `it-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }
export type ItemInput = Omit<InventoryItem, "id">;
export function createItem(input: ItemInput): InventoryItem {
  const it: InventoryItem = { ...input, id: iid() };
  _items = [it, ..._items];
  return it;
}
export function updateItem(id: string, patch: Partial<InventoryItem>): void {
  _items = _items.map(i => i.id === id ? { ...i, ...patch, id: i.id } : i);
}
export function deleteItem(id: string): void { _items = _items.filter(i => i.id !== id); }
export function adjustItemQty(id: string, delta: number): void {
  _items = _items.map(i => i.id === id ? { ...i, qtyOnHand: Math.max(0, i.qtyOnHand + delta) } : i);
}

export function getPurchaseOrders(): PurchaseOrder[] { return PURCHASE_ORDERS; }
export function getOpenPurchaseOrders(): PurchaseOrder[] { return PURCHASE_ORDERS.filter(p => p.status === "open"); }
export function getVendors(): Vendor[] { return VENDORS; }
export function getSubcontractors(): Subcontractor[] { return SUBCONTRACTORS; }
export function getInventoryActivity(): InventoryActivity[] { return ACTIVITY; }
