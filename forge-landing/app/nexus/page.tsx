"use client";

import { NexusSidebar } from "./components/sidebar";
import KanbanBoard from "./components/kanban-board";
import { MeetingEditor } from "./components/meeting-editor";
import { ContributionGraph } from "./components/contribution-graph";
import { FileTree } from "./components/file-tree";

export default function NexusDashboard() {
  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-mono overflow-hidden">
      <NexusSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-10 border-b border-zinc-800 flex items-center px-4 shrink-0">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Sprint 24 &middot; Feb 17 &ndash; Feb 28</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] text-zinc-600">4 online</span>
            <div className="flex -space-x-1">
              {["#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"].map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full border border-zinc-800" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </header>

        {/* Content grid */}
        <div className="flex-1 flex min-h-0">
          {/* Kanban — primary area */}
          <div className="flex-1 min-w-0 overflow-auto border-r border-zinc-800">
            <KanbanBoard />
          </div>

          {/* Right panel */}
          <div className="w-[340px] shrink-0 flex flex-col min-h-0 divide-y divide-zinc-800">
            <div className="flex-1 min-h-0 overflow-auto">
              <MeetingEditor />
            </div>
            <div className="p-3">
              <ContributionGraph />
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <FileTree />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
