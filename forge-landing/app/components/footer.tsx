"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <>
      {/* CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 blur-[100px] rounded-full" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-display font-bold text-3xl md:text-5xl lg:text-6xl tracking-tighter leading-[1]">
              Ready to ship
              <br />
              <span className="text-accent">with confidence?</span>
            </h2>
            <p className="mt-6 text-lg text-foreground-muted max-w-[45ch] mx-auto">
              Join 2,400+ engineering teams already using Forge to plan, build,
              and deliver great software.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold bg-accent text-background rounded-lg hover:bg-accent-hover transition-all duration-200 active:scale-[0.98]"
              >
                Start building free
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-foreground-muted border border-border rounded-lg hover:border-foreground-subtle hover:text-foreground transition-all duration-200"
              >
                Book a demo
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-12">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="text-background"
                  >
                    <path
                      d="M2 4L9 1L16 4V14L9 17L2 14V4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="font-display font-semibold text-sm tracking-tight">
                  Forge
                </span>
              </div>
              <p className="text-xs text-foreground-subtle leading-relaxed max-w-[28ch]">
                Project management built for the way engineering teams actually
                work.
              </p>
            </div>

            {/* Links */}
            {[
              {
                heading: "Product",
                links: ["Features", "Pricing", "Changelog", "Roadmap"],
              },
              {
                heading: "Resources",
                links: ["Docs", "API Reference", "Blog", "Community"],
              },
              {
                heading: "Company",
                links: ["About", "Careers", "Security", "Contact"],
              },
            ].map((group) => (
              <div key={group.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">
                  {group.heading}
                </h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-foreground-subtle hover:text-foreground transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-foreground-subtle">
              &copy; {new Date().getFullYear()} Forge. All rights reserved.
            </span>
            <div className="flex items-center gap-4 text-xs text-foreground-subtle">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
