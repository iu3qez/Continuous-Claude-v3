"use client";

import { useState } from "react";

const teamMembers = [
  { name: "Alex Chen", initials: "AC", color: "#f59e0b", online: true },
  { name: "Sarah Kim", initials: "SK", color: "#8b5cf6", online: true },
  { name: "Marcus Johnson", initials: "MJ", color: "#ef4444", online: false },
  { name: "Priya Patel", initials: "PP", color: "#06b6d4", online: true },
  { name: "David Lee", initials: "DL", color: "#22c55e", online: false },
  { name: "Emma Wilson", initials: "EW", color: "#ec4899", online: true },
];

const navItems = [
  { label: "Dashboard", icon: "\u25A3", active: true, count: undefined },
  { label: "Sprint Board", icon: "\u2630", active: false, count: 3 },
  { label: "Docs", icon: "\u2637", active: false, count: undefined },
  { label: "Analytics", icon: "\u2261", active: false, count: undefined },
  { label: "Settings", icon: "\u2699", active: false, count: undefined },
] as const;

export function NexusSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col h-screen border-r border-border-subtle bg-background ${
        collapsed ? "w-12" : "w-60"
      }`}
    >
      {/* Toggle + Workspace header */}
      <div className="flex items-center h-7 border-b border-border-subtle px-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-5 h-5 text-foreground-muted hover:text-foreground rounded-sm hover:bg-surface-elevated"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="shrink-0"
          >
            {collapsed ? (
              <path
                d="M5 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M9 3L5 7l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
        {!collapsed && (
          <span className="ml-2 text-xs font-medium tracking-wide text-foreground font-mono uppercase">
            Nexus
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-1 overflow-y-auto">
        <ul className="flex flex-col">
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href="#"
                className={`flex items-center h-7 px-2 gap-2 text-xs ${
                  item.active
                    ? "bg-surface-elevated text-foreground"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="w-4 text-center text-sm leading-none shrink-0">
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="font-mono text-[10px] text-foreground-subtle bg-surface-elevated px-1 rounded-sm">
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Team Members */}
      <div className="border-t border-border-subtle py-1">
        {!collapsed && (
          <div className="px-2 py-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
              Team
            </span>
          </div>
        )}
        <ul className={`flex flex-col ${collapsed ? "items-center gap-1 py-1" : ""}`}>
          {teamMembers.map((member) => (
            <li
              key={member.initials}
              className={`flex items-center ${
                collapsed ? "justify-center" : "h-7 px-2 gap-2"
              }`}
              title={collapsed ? `${member.name} (${member.online ? "online" : "offline"})` : undefined}
            >
              {/* Avatar */}
              <span
                className="relative flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-mono font-bold text-white shrink-0"
                style={{ backgroundColor: member.color }}
              >
                {member.initials}
                {/* Status dot */}
                <span
                  className={`absolute -bottom-px -right-px w-1.5 h-1.5 rounded-full border border-background ${
                    member.online ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
              </span>
              {!collapsed && (
                <span className="text-xs text-foreground-muted truncate">
                  {member.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
