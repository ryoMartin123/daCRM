// Marketing settings — sender/branding defaults plus which campaign types and
// audience segments are enabled. localStorage-backed; mirrors a future
// `marketing_settings` row. The Marketing module + CampaignBuilder read these.

import { AUDIENCES, CAMPAIGN_TYPE_CONFIG, type CampaignType, type AudienceDef } from "./data";

export interface MarketingSettings {
  sender: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
    smsSender: string;
    emailFooter: string;
    includeUnsubscribe: boolean;
  };
  disabledTypes: CampaignType[];      // campaign types turned off
  disabledAudiences: string[];        // audience keys turned off
}

const KEY = "crm-marketing-settings";

export function defaultMarketingSettings(): MarketingSettings {
  return {
    sender: {
      fromName: "Northstar Services",
      fromEmail: "hello@northstarservices.com",
      replyTo: "hello@northstarservices.com",
      smsSender: "NORTHSTAR",
      emailFooter: "Northstar Services · Augusta, GA · (706) 555-0100",
      includeUnsubscribe: true,
    },
    disabledTypes: [],
    disabledAudiences: [],
  };
}

let _cache: MarketingSettings | null = null;

export function getMarketingSettings(): MarketingSettings {
  if (_cache) return _cache;
  if (typeof window === "undefined") return defaultMarketingSettings();
  try {
    const raw = localStorage.getItem(KEY);
    const d = defaultMarketingSettings();
    if (!raw) { _cache = d; return d; }
    const parsed = JSON.parse(raw) as Partial<MarketingSettings>;
    _cache = {
      sender: { ...d.sender, ...(parsed.sender ?? {}) },
      disabledTypes: parsed.disabledTypes ?? [],
      disabledAudiences: parsed.disabledAudiences ?? [],
    };
  } catch { _cache = defaultMarketingSettings(); }
  return _cache;
}

export function saveMarketingSettings(s: MarketingSettings): void {
  _cache = s;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ─── Derived helpers consumed by the module + builder ─────
export function enabledCampaignTypes(): CampaignType[] {
  const off = new Set(getMarketingSettings().disabledTypes);
  return (Object.keys(CAMPAIGN_TYPE_CONFIG) as CampaignType[]).filter(t => !off.has(t));
}
export function enabledAudiences(): AudienceDef[] {
  const off = new Set(getMarketingSettings().disabledAudiences);
  return AUDIENCES.filter(a => !off.has(a.key));
}
