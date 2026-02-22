"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";

/*
 * Pricing section — based on shadcnspace pricing-03 pattern
 *   Install: npx shadcn@latest add @shadcn-space/pricing-03
 *   Customized: dark/editorial aesthetic, amber accent on recommended tier
 *
 * Tier 2 search: shadcnspace → "pricing" → pricing-03 (3-tier + toggle)
 */

const PLANS = [
  {
    name: "Starter",
    monthly: 0,
    yearly: 0,
    description: "For individuals and small side projects.",
    features: [
      "Up to 3 projects",
      "Kanban boards",
      "Basic Gantt view",
      "5 GB storage",
      "Community support",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 18,
    yearly: 14,
    description: "For growing teams that need power and flexibility.",
    features: [
      "Unlimited projects",
      "Advanced Kanban + Gantt",
      "Rich text editor & docs",
      "50 GB storage",
      "Priority support",
      "Custom workflows",
      "API access",
      "Integrations (GitHub, Slack, Linear)",
    ],
    cta: "Start 14-day trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    description: "For organizations needing security, compliance, and scale.",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Audit logs",
      "99.9% SLA",
      "Unlimited storage",
      "Dedicated account manager",
      "Custom integrations",
      "On-premise option",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="relative py-24 md:py-32">
      {/* Background accent glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/3 blur-[140px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Pricing
          </span>
          <h2 className="mt-4 font-display font-bold text-3xl md:text-5xl tracking-tight">
            Simple, transparent pricing.
          </h2>
          <p className="mt-4 text-foreground-muted text-lg">
            Start free. Scale when you&apos;re ready. No surprise fees.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-surface border border-border-subtle">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 ${
                !isYearly
                  ? "bg-surface-elevated text-foreground font-medium"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                isYearly
                  ? "bg-surface-elevated text-foreground font-medium"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Yearly
              <span className="text-[10px] font-semibold text-accent bg-accent-muted px-1.5 py-0.5 rounded-full">
                -22%
              </span>
            </button>
          </div>
        </div>

        {/* Cards — asymmetric grid (center card is elevated) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`relative rounded-2xl border p-6 md:p-8 flex flex-col ${
                plan.highlighted
                  ? "border-accent/30 bg-surface shadow-lg shadow-accent/5 md:-mt-4 md:mb-[-16px]"
                  : "border-border-subtle bg-surface"
              }`}
            >
              {/* Recommended badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent-muted rounded-full border border-accent/20">
                  <Sparkles className="w-3 h-3" />
                  Most popular
                </div>
              )}

              {/* Plan name */}
              <h3 className="font-display font-semibold text-xl tracking-tight">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-foreground-muted">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mt-6 mb-6">
                {plan.monthly !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-4xl tracking-tight">
                      ${isYearly ? plan.yearly : plan.monthly}
                    </span>
                    <span className="text-sm text-foreground-muted">
                      /user/mo
                    </span>
                  </div>
                ) : (
                  <div className="font-display font-bold text-4xl tracking-tight">
                    Custom
                  </div>
                )}
              </div>

              {/* CTA */}
              <a
                href="#"
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] mb-8 ${
                  plan.highlighted
                    ? "bg-accent text-background hover:bg-accent-hover"
                    : "border border-border text-foreground hover:border-foreground-subtle hover:bg-surface-elevated"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              {/* Features */}
              <div className="border-t border-border-subtle pt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground-muted">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
