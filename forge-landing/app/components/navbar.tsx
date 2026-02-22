"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border-subtle"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-12 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="text-background"
            >
              <path
                d="M2 4L9 1L16 4V14L9 17L2 14V4Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M9 1V17M2 4L16 14M16 4L2 14"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
                opacity="0.5"
              />
            </svg>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">
            Forge
          </span>
        </a>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-foreground-muted">
          <a
            href="#features"
            className="hover:text-foreground transition-colors duration-200"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="hover:text-foreground transition-colors duration-200"
          >
            Pricing
          </a>
          <a
            href="#"
            className="hover:text-foreground transition-colors duration-200"
          >
            Docs
          </a>
          <a
            href="#"
            className="hover:text-foreground transition-colors duration-200"
          >
            Changelog
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="hidden sm:inline-flex text-sm text-foreground-muted hover:text-foreground transition-colors duration-200"
          >
            Sign in
          </a>
          <a
            href="#"
            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors duration-200 active:scale-[0.98]"
          >
            Get started
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
