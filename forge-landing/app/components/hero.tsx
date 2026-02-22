"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  GitBranch,
  BarChart3,
} from "lucide-react";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      {/* Background gradient mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/3 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-12 pt-28 pb-20 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-16 lg:gap-20 items-center"
        >
          {/* Left: Copy */}
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium tracking-wide uppercase text-accent bg-accent-muted rounded-full border border-accent/20">
                <Zap className="w-3.5 h-3.5" />
                Now in public beta
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="mt-8 font-display font-bold text-4xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95]"
            >
              Ship projects,
              <br />
              <span className="text-accent">not spreadsheets.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg md:text-xl text-foreground-muted leading-relaxed max-w-[52ch]"
            >
              Forge combines Kanban boards, Gantt timelines, and a rich text
              editor into one tool built for the way engineering teams actually
              work.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-accent text-background rounded-lg hover:bg-accent-hover transition-all duration-200 active:scale-[0.98]"
              >
                Start building free
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground-muted border border-border rounded-lg hover:border-foreground-subtle hover:text-foreground transition-all duration-200"
              >
                Try the demos
              </a>
            </motion.div>

            {/* Trust stats */}
            <motion.div
              variants={fadeUp}
              className="mt-14 flex items-center gap-8 text-sm text-foreground-subtle"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-accent" />
                <span>
                  <span className="text-foreground font-medium">2,400+</span>{" "}
                  teams
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                <span>
                  <span className="text-foreground font-medium">12M+</span>{" "}
                  tasks tracked
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: Product Preview (mini kanban) */}
          <motion.div
            variants={fadeUp}
            className="hidden lg:block w-[420px]"
          >
            <div className="relative rounded-xl border border-border-subtle bg-surface p-4 shadow-2xl shadow-black/30">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground-subtle/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-foreground-subtle/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-foreground-subtle/30" />
                <div className="ml-4 h-5 w-48 rounded bg-surface-elevated" />
              </div>

              {/* Mini kanban preview */}
              <div className="grid grid-cols-3 gap-2.5">
                {["To Do", "In Progress", "Done"].map((col, ci) => (
                  <div
                    key={col}
                    className="rounded-lg bg-background p-2.5 space-y-2"
                  >
                    <div className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider mb-2">
                      {col}
                    </div>
                    {Array.from({ length: ci === 1 ? 3 : 2 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.8 + ci * 0.15 + i * 0.1,
                          duration: 0.4,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="rounded-md bg-surface-elevated border border-border-subtle p-2"
                      >
                        <div className="h-2 w-3/4 rounded bg-foreground-subtle/20 mb-1.5" />
                        <div className="h-1.5 w-1/2 rounded bg-foreground-subtle/10" />
                        {ci === 1 && i === 0 && (
                          <div className="mt-2 h-1.5 w-10 rounded bg-accent/40" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating accent glow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-accent/10 blur-[60px] rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
