import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/site/ui";
import LeadForm from "@/components/site/LeadForm";
import { Mail, MessageSquare, Handshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Routiqa",
  description: "Talk to the Routiqa team about the platform, early access, or the design partner program.",
};

const WAYS = [
  { icon: MessageSquare, title: "General questions", body: "Curious how Routiqa fits your operation? We're happy to walk through it." },
  { icon: Handshake, title: "Design partners", body: "Interested in shaping the product? Ask us about the program." },
  { icon: Mail, title: "Everything else", body: "Press, partnerships, or anything else — send it our way." },
];

export default function ContactPage() {
  return (
    <Section className="site-hero-bg">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Talk to us"
            sub="Whether you're exploring Routiqa, interested in early access, or want to become a design partner — we'd love to hear from you."
          />
          <div className="mt-8 space-y-5">
            {WAYS.map(w => (
              <div key={w.title} className="flex gap-4">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-soft-bg)" }}><w.icon className="w-5 h-5" style={{ color: "var(--accent-text)" }} /></span>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{w.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <LeadForm variant="contact" />
      </div>
    </Section>
  );
}
