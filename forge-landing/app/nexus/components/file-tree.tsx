"use client";

import { useState, useCallback } from "react";

interface TreeNode {
  name: string;
  type: "folder" | "file";
  children?: TreeNode[];
}

const FILE_TREE: TreeNode[] = [
  {
    name: "docs",
    type: "folder",
    children: [
      {
        name: "architecture",
        type: "folder",
        children: [
          { name: "system-overview.md", type: "file" },
          { name: "api-design.md", type: "file" },
          { name: "database-schema.md", type: "file" },
        ],
      },
      {
        name: "guides",
        type: "folder",
        children: [
          { name: "onboarding.md", type: "file" },
          { name: "deployment.md", type: "file" },
          { name: "troubleshooting.md", type: "file" },
        ],
      },
      {
        name: "meeting-notes",
        type: "folder",
        children: [
          { name: "2026-02-20.md", type: "file" },
          { name: "2026-02-22.md", type: "file" },
        ],
      },
    ],
  },
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          { name: "kanban.tsx", type: "file" },
          { name: "editor.tsx", type: "file" },
        ],
      },
      {
        name: "lib",
        type: "folder",
        children: [
          { name: "utils.ts", type: "file" },
          { name: "api.ts", type: "file" },
        ],
      },
      { name: "config.json", type: "file" },
    ],
  },
  { name: "README.md", type: "file" },
];

function getFileIcon(name: string): string {
  if (name.endsWith(".md")) return "\u25C6";       // filled diamond
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "\u25C7"; // outline diamond
  if (name.endsWith(".json") || name.endsWith(".yaml") || name.endsWith(".yml")) return "\u25CB"; // circle
  return "\u25CB"; // default circle
}

interface TreeNodeRowProps {
  node: TreeNode;
  depth: number;
  expandedPaths: Set<string>;
  activePath: string | null;
  path: string;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}

function TreeNodeRow({
  node,
  depth,
  expandedPaths,
  activePath,
  path,
  onToggle,
  onSelect,
}: TreeNodeRowProps) {
  const isFolder = node.type === "folder";
  const isExpanded = expandedPaths.has(path);
  const isActive = activePath === path;

  return (
    <>
      <button
        className={`flex items-center w-full h-6 text-left text-xs font-mono group ${
          isActive
            ? "bg-surface-elevated text-foreground"
            : "text-foreground-muted hover:text-foreground hover:bg-surface"
        }`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => {
          if (isFolder) {
            onToggle(path);
          } else {
            onSelect(path);
          }
        }}
      >
        {/* Indent guides */}
        {Array.from({ length: depth }).map((_, i) => (
          <span
            key={i}
            className="absolute border-l border-border-subtle"
            style={{
              left: i * 16 + 14,
              top: 0,
              bottom: 0,
            }}
          />
        ))}

        {/* Icon */}
        <span className="w-4 text-center text-[10px] shrink-0">
          {isFolder ? (isExpanded ? "\u25BE" : "\u25B8") : getFileIcon(node.name)}
        </span>

        {/* Name */}
        <span className="ml-1 truncate">{node.name}</span>
      </button>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <>
          {node.children.map((child) => {
            const childPath = `${path}/${child.name}`;
            return (
              <TreeNodeRow
                key={childPath}
                node={child}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                activePath={activePath}
                path={childPath}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            );
          })}
        </>
      )}
    </>
  );
}

export function FileTree() {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(["docs", "docs/architecture", "src", "src/components"])
  );
  const [activePath, setActivePath] = useState<string | null>(
    "docs/architecture/system-overview.md"
  );

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((path: string) => {
    setActivePath(path);
  }, []);

  return (
    <div className="flex flex-col border border-border-subtle rounded-sm bg-surface">
      {/* Section header */}
      <div className="px-3 py-1.5 border-b border-border-subtle">
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
          Documentation
        </span>
      </div>

      {/* Tree */}
      <div className="relative py-0.5 overflow-y-auto max-h-[320px]">
        {FILE_TREE.map((node) => (
          <TreeNodeRow
            key={node.name}
            node={node}
            depth={0}
            expandedPaths={expandedPaths}
            activePath={activePath}
            path={node.name}
            onToggle={handleToggle}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
