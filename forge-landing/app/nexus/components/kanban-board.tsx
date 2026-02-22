"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---- Types ---- */

type Priority = "high" | "medium" | "low";
type ColumnId = "backlog" | "todo" | "in-progress" | "done";
type Tag = "frontend" | "backend" | "devops" | "design" | "bug" | "feature";

interface Task {
  id: string;
  title: string;
  column: ColumnId;
  tags: Tag[];
  assignee: string;
  priority: Priority;
}

interface ColumnDef {
  id: ColumnId;
  title: string;
}

/* ---- Constants ---- */

const COLUMNS: ColumnDef[] = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const ALL_TAGS: Tag[] = ["frontend", "backend", "devops", "design", "bug", "feature"];

const TAG_DISPLAY: Record<Tag, { label: string; bg: string; text: string }> = {
  frontend: { label: "FE", bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  backend: { label: "BE", bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
  devops: { label: "OPS", bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
  design: { label: "DSN", bg: "rgba(168,85,247,0.15)", text: "#a855f7" },
  bug: { label: "BUG", bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  feature: { label: "FT", bg: "rgba(6,182,212,0.15)", text: "#06b6d4" },
};

const INITIAL_TASKS: Task[] = [
  // Backlog
  { id: "NEX-101", title: "Migrate auth to OAuth2 PKCE", column: "backlog", tags: ["backend", "feature"], assignee: "AC", priority: "medium" },
  { id: "NEX-102", title: "Design system token audit", column: "backlog", tags: ["design"], assignee: "SK", priority: "low" },
  { id: "NEX-103", title: "CI pipeline caching fix", column: "backlog", tags: ["devops", "bug"], assignee: "MJ", priority: "high" },
  { id: "NEX-104", title: "Add dark mode toggle", column: "backlog", tags: ["frontend", "feature"], assignee: "PP", priority: "low" },
  // To Do
  { id: "NEX-105", title: "Write API rate-limit middleware", column: "todo", tags: ["backend"], assignee: "AC", priority: "high" },
  { id: "NEX-106", title: "Sprint board drag reorder", column: "todo", tags: ["frontend", "feature"], assignee: "DL", priority: "medium" },
  { id: "NEX-107", title: "Fix tooltip z-index overlap", column: "todo", tags: ["frontend", "bug"], assignee: "SK", priority: "high" },
  { id: "NEX-108", title: "Terraform state lock issue", column: "todo", tags: ["devops", "bug"], assignee: "MJ", priority: "medium" },
  // In Progress
  { id: "NEX-109", title: "Dashboard analytics widgets", column: "in-progress", tags: ["frontend"], assignee: "PP", priority: "high" },
  { id: "NEX-110", title: "Refactor user service queries", column: "in-progress", tags: ["backend"], assignee: "AC", priority: "medium" },
  { id: "NEX-111", title: "Navigation sidebar redesign", column: "in-progress", tags: ["design", "frontend"], assignee: "SK", priority: "medium" },
  // Done
  { id: "NEX-112", title: "Database migration v3", column: "done", tags: ["backend", "devops"], assignee: "DL", priority: "high" },
  { id: "NEX-113", title: "Onboarding flow wireframes", column: "done", tags: ["design"], assignee: "SK", priority: "low" },
  { id: "NEX-114", title: "Fix login redirect loop", column: "done", tags: ["frontend", "bug"], assignee: "PP", priority: "high" },
  { id: "NEX-115", title: "Container health checks", column: "done", tags: ["devops"], assignee: "MJ", priority: "low" },
];

/* ---- Sortable task row ---- */

function SortableTaskRow({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-30" : ""}
      {...attributes}
      {...listeners}
    >
      <TaskRow task={task} />
    </div>
  );
}

/* ---- Static task row (shared between sortable + overlay) ---- */

function TaskRow({ task }: { task: Task }) {
  return (
    <div
      className="flex items-center h-[34px] px-2 gap-2 border-b cursor-grab active:cursor-grabbing select-none"
      style={{
        borderBottomColor: "#27272a",
        borderLeftWidth: 3,
        borderLeftColor: PRIORITY_COLORS[task.priority],
        backgroundColor: "#18181b",
      }}
    >
      {/* Task ID */}
      <span
        className="shrink-0 text-[11px]"
        style={{ fontFamily: "var(--font-mono)", color: "#71717a" }}
      >
        {task.id}
      </span>

      {/* Title */}
      <span
        className="flex-1 truncate text-[12px]"
        style={{ color: "#f4f4f5" }}
      >
        {task.title}
      </span>

      {/* Tags */}
      <div className="flex items-center gap-0.5 shrink-0">
        {task.tags.map((tag) => {
          const t = TAG_DISPLAY[tag];
          return (
            <span
              key={tag}
              className="inline-flex items-center px-1 py-px text-[9px] font-medium"
              style={{
                backgroundColor: t.bg,
                color: t.text,
                borderRadius: 2,
              }}
            >
              {t.label}
            </span>
          );
        })}
      </div>

      {/* Assignee */}
      <div
        className="shrink-0 flex items-center justify-center text-[9px] font-bold"
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: "rgba(161,161,170,0.15)",
          color: "#a1a1aa",
        }}
      >
        {task.assignee}
      </div>
    </div>
  );
}

/* ---- Droppable column ---- */

function Column({
  column,
  tasks,
}: {
  column: ColumnDef;
  tasks: Task[];
}) {
  const isDone = column.id === "done";

  return (
    <div
      className="flex flex-col min-h-0"
      style={{
        backgroundColor: "#0a0a0b",
        borderRight: column.id !== "done" ? "1px solid #27272a" : undefined,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between h-[30px] px-2 shrink-0"
        style={{ borderBottom: "1px solid #27272a" }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: isDone ? "#22c55e" : "#a1a1aa" }}
        >
          {column.title}
        </span>
        <span
          className="text-[10px]"
          style={{ fontFamily: "var(--font-mono)", color: "#71717a" }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto min-h-[60px]">
          {tasks.map((task) => (
            <SortableTaskRow key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div
              className="flex items-center justify-center h-[60px] text-[11px]"
              style={{ color: "#3f3f46" }}
            >
              No tasks
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/* ---- Tag filter bar ---- */

function TagFilter({
  activeTags,
  onToggle,
}: {
  activeTags: Set<Tag>;
  onToggle: (tag: Tag) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-2 h-[28px] shrink-0" style={{ borderBottom: "1px solid #27272a" }}>
      <span className="text-[10px] mr-1" style={{ color: "#71717a" }}>
        Filter:
      </span>
      {ALL_TAGS.map((tag) => {
        const t = TAG_DISPLAY[tag];
        const active = activeTags.has(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className="px-1.5 py-px text-[10px] font-medium transition-colors"
            style={{
              borderRadius: 2,
              backgroundColor: active ? t.bg : "transparent",
              color: active ? t.text : "#71717a",
              border: active ? "none" : "1px solid #27272a",
            }}
          >
            {tag}
          </button>
        );
      })}
      {activeTags.size > 0 && (
        <button
          onClick={() => activeTags.forEach((t) => onToggle(t))}
          className="ml-1 text-[10px] transition-colors"
          style={{ color: "#71717a" }}
        >
          clear
        </button>
      )}
    </div>
  );
}

/* ---- Main board ---- */

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeTags, setActiveTags] = useState<Set<Tag>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const toggleTag = useCallback((tag: Tag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  // Group tasks by column, applying tag filter
  const tasksByColumn = useMemo(() => {
    const filtered = activeTags.size > 0
      ? tasks.filter((t) => t.tags.some((tag) => activeTags.has(tag)))
      : tasks;

    const grouped: Record<ColumnId, Task[]> = {
      backlog: [],
      todo: [],
      "in-progress": [],
      done: [],
    };
    for (const task of filtered) {
      grouped[task.column].push(task);
    }
    return grouped;
  }, [tasks, activeTags]);

  function findTaskColumn(taskId: string): ColumnId | undefined {
    return tasks.find((t) => t.id === taskId)?.column;
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findTaskColumn(activeId);
    // over could be a task or a column id
    const overCol = findTaskColumn(overId) ?? (overId as ColumnId);

    if (!activeCol || !overCol || activeCol === overCol) return;

    // Move task to new column
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, column: overCol } : t
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findTaskColumn(activeId);
    const overCol = findTaskColumn(overId);

    if (!activeCol || !overCol) return;

    if (activeCol === overCol) {
      // Reorder within same column
      setTasks((prev) => {
        const colTasks = prev.filter((t) => t.column === activeCol);
        const otherTasks = prev.filter((t) => t.column !== activeCol);
        const oldIndex = colTasks.findIndex((t) => t.id === activeId);
        const newIndex = colTasks.findIndex((t) => t.id === overId);
        return [...otherTasks, ...arrayMove(colTasks, oldIndex, newIndex)];
      });
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#0a0a0b" }}
    >
      {/* Tag filter bar */}
      <TagFilter activeTags={activeTags} onToggle={toggleTag} />

      {/* Board columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-4 min-h-0">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={tasksByColumn[col.id]}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div style={{ width: 300 }}>
              <TaskRow task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
