"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Columns3, BarChart3, FileText } from "lucide-react";
import dynamic from "next/dynamic";

/*
 * Kibo UI component integration — 3-tier search result:
 *   Tier 3 (Kibo UI): Kanban, Gantt, Editor
 *   Install commands:
 *     npx kibo-ui add kanban   (deps: @dnd-kit/core, @dnd-kit/sortable)
 *     npx kibo-ui add gantt    (deps: date-fns)
 *     npx kibo-ui add editor   (deps: @tiptap/react, @tiptap/starter-kit)
 *
 * These demos implement the component patterns directly using the
 * same underlying libraries for the interactive landing page preview.
 */

const KanbanDemo = dynamic(() => import("./kanban-demo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});
const GanttDemo = dynamic(() => import("./gantt-demo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});
const EditorDemo = dynamic(() => import("./editor-demo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});

function DemoSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-3 text-foreground-subtle text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-accent/40 border-t-accent animate-spin" />
        Loading demo...
      </div>
    </div>
  );
}

const TABS = [
  {
    id: "kanban",
    label: "Kanban Board",
    icon: Columns3,
    description:
      "Drag cards between columns. Powered by @dnd-kit — the same library used in production.",
  },
  {
    id: "gantt",
    label: "Gantt Timeline",
    icon: BarChart3,
    description:
      "Visualize project timelines with progress tracking. Built with date-fns for precise scheduling.",
  },
  {
    id: "editor",
    label: "Rich Text Editor",
    icon: FileText,
    description:
      "Full-featured writing experience. Built on TipTap with formatting, lists, and blockquotes.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Features() {
  const [activeTab, setActiveTab] = useState<TabId>("kanban");
  const activeInfo = TABS.find((t) => t.id === activeTab)!;

  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        {/* Section header — asymmetric layout (DESIGN_VARIANCE=8) */}
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Interactive demos
          </span>
          <h2 className="mt-4 font-display font-bold text-3xl md:text-5xl tracking-tight leading-[1.1]">
            Try before you commit.
          </h2>
          <p className="mt-4 text-foreground-muted text-lg leading-relaxed max-w-[50ch]">
            These aren&apos;t mockups. Every component below is fully
            interactive — the same building blocks your team will use daily.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border-subtle w-fit mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-foreground" : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-surface-elevated rounded-lg border border-border-subtle"
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 25,
                    }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10 hidden sm:inline">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Description */}
        <p className="text-sm text-foreground-subtle mb-4">
          {activeInfo.description}
        </p>

        {/* Demo area */}
        <div className="relative rounded-2xl border border-border-subtle bg-surface overflow-hidden">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle bg-background/50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-foreground-subtle/20" />
              <div className="w-3 h-3 rounded-full bg-foreground-subtle/20" />
              <div className="w-3 h-3 rounded-full bg-foreground-subtle/20" />
            </div>
            <div className="ml-4 flex-1 max-w-xs">
              <div className="h-6 rounded-md bg-surface-elevated border border-border-subtle flex items-center px-3">
                <span className="text-[10px] font-mono text-foreground-subtle">
                  forge.app/{activeTab === "kanban" ? "board" : activeTab === "gantt" ? "timeline" : "docs"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive content */}
          <div className="p-4 md:p-6 min-h-[400px] md:min-h-[460px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="h-[360px] md:h-[400px]"
              >
                {activeTab === "kanban" && <KanbanDemo />}
                {activeTab === "gantt" && <GanttDemo />}
                {activeTab === "editor" && <EditorDemo />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
