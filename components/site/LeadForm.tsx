"use client";

// ─── Marketing lead form ──────────────────────────────────
// Early Access + Contact share this form. It validates client-side and shows a
// success state. NOTE: submission isn't wired to a backend yet — it stores the
// submission in localStorage and confirms. Swap the `submit` body for a real
// endpoint (Supabase table / email provider) when ready.

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { INDUSTRIES } from "./nav";

type Variant = "early-access" | "contact";

export default function LeadForm({ variant }: { variant: Variant }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", industry: "", size: "", message: "" });
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim()) { setError("Please add your name and email."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) { setError("Please enter a valid email."); return; }
    setBusy(true);
    // Placeholder persistence until a backend is wired.
    try {
      const key = "routiqa-leads";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push({ ...form, variant, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch { /* ignore */ }
    setTimeout(() => { setBusy(false); setSent(true); }, 500);
  };

  if (sent) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-glow)" }}>
        <span className="w-14 h-14 rounded-full inline-flex items-center justify-center mb-4" style={{ backgroundColor: "var(--accent-soft-2-bg)" }}>
          <CheckCircle2 className="w-7 h-7" style={{ color: "var(--accent-text-strong)" }} />
        </span>
        <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Thanks, {form.name.split(" ")[0] || "there"} — we'll be in touch.</h3>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          {variant === "early-access"
            ? "Your early-access request is in. We'll reach out shortly with next steps."
            : "We received your message and will get back to you soon."}
        </p>
      </div>
    );
  }

  const field = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent-text)]";
  const fieldStyle = { backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" } as React.CSSProperties;

  return (
    <form onSubmit={submit} className="rounded-2xl p-6 lg:p-8 space-y-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-glow)" }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Labeled label="Name *"><input className={field} style={fieldStyle} value={form.name} onChange={set("name")} placeholder="Jordan Reyes" /></Labeled>
        <Labeled label="Company"><input className={field} style={fieldStyle} value={form.company} onChange={set("company")} placeholder="Reyes HVAC" /></Labeled>
        <Labeled label="Email *"><input className={field} style={fieldStyle} value={form.email} onChange={set("email")} placeholder="jordan@reyeshvac.com" type="email" /></Labeled>
        <Labeled label="Phone"><input className={field} style={fieldStyle} value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" /></Labeled>
        <Labeled label="Industry">
          <select className={field} style={fieldStyle} value={form.industry} onChange={set("industry")}>
            <option value="">Select…</option>
            {INDUSTRIES.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
          </select>
        </Labeled>
        <Labeled label="Team size">
          <select className={field} style={fieldStyle} value={form.size} onChange={set("size")}>
            <option value="">Select…</option>
            {["1–5", "6–15", "16–50", "51–150", "150+"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Labeled>
      </div>
      <Labeled label={variant === "contact" ? "How can we help? *" : "Anything we should know?"}>
        <textarea className={field} style={fieldStyle} rows={4} value={form.message} onChange={set("message")} placeholder={variant === "contact" ? "Tell us a bit about your business…" : "What are you running on today?"} />
      </Labeled>
      {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
      <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-70" style={{ backgroundColor: "#4f46e5" }}>
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : (variant === "early-access" ? "Request Early Access" : "Send message")}
      </button>
      <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>We'll only use your details to follow up about Routiqa.</p>
    </form>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</span>
      {children}
    </label>
  );
}
