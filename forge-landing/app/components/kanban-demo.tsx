"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Tag } from "lucide-react";

/* ---- Types ---- */

interface Task {
  id: string;
  title: string;
  tag?: string;
  tagColor?: string;
  assignee?: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

/* ---- Initial data ---- */

const INITIAL_COLUMNS: Column[] = [
  {
    id: "todo",
    title: "To Do",
    tasks: [
      { id: "t1", title: "Design token system", tag: "Design", tagColor: "bg-violet-500/20 text-violet-400" },
      { id: "t2", title: "Set up CI pipeline", tag: "DevOps", tagColor: "bg-blue-500/20 text-blue-400" },
      { id: "t3", title: "Write API spec", tag: "Backend", tagColor: "bg-emerald-500/20 text-emerald-400" },
    ],
  },
  {
    id: "progress",
    title: "In Progress",
    tasks: [
      { id: "t4", title: "Auth service refactor", tag: "Backend", tagColor: "bg-emerald-500/20 text-emerald-400", assignee: "AK" },
      { id: "t5", title: "Dashboard layout v2", tag: "Frontend", tagColor: "bg-amber-500/20 text-amber-400", assignee: "MR" },
    ],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      { id: "t6", title: "Database migration", tag: "DevOps", tagColor: "bg-blue-500/20 text-blue-400" },
    ],
  },
];

/* ---- Sortable card ---- */

function SortableCard({ task }: { task: Task }) {
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
      className={`kanban-card group rounded-lg border border-border-subtle bg-surface-elevated p-3 ${
        isDragging ? "kanban-card-dragging opacity-50" : ""
      }`}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {task.title}
          </p>
          <div className="flex items-center justify-between mt-2">
            {task.tag && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${task.tagColor}`}
              >
                <Tag className="w-2.5 h-2.5" />
                {task.tag}
              </span>
            )}
            {task.assignee && (
              <div className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[9px] font-bold flex items-center justify-center">
                {task.assignee}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Overlay card (shown while dragging) ---- */

function OverlayCard({ task }: { task: Task }) {
  return (
    <div className="kanban-card kanban-card-dragging rounded-lg border border-accent/30 bg-surface-elevated p-3 w-[220px]">
      <p className="text-sm font-medium text-foreground">{task.title}</p>
      {task.tag && (
        <span
          className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${task.tagColor}`}
        >
          <Tag className="w-2.5 h-2.5" />
          {task.tag}
        </span>
      )}
    </div>
  );
}

/* ---- Kanban board ---- */

export default function KanbanDemo() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function findColumn(taskId: string) {
    return columns.find((col) => col.tasks.some((t) => t.id === taskId));
  }

  function handleDragStart(event: DragStartEvent) {
    const col = findColumn(event.active.id as string);
    const task = col?.tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceCol = findColumn(active.id as string);
    const destCol = findColumn(over.id as string);

    if (!sourceCol || !destCol) return;

    if (sourceCol.id === destCol.id) {
      // Reorder within same column
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id !== sourceCol.id) return col;
          const oldIndex = col.tasks.findIndex((t) => t.id === active.id);
          const newIndex = col.tasks.findIndex((t) => t.id === over.id);
          return { ...col, tasks: arrayMove(col.tasks, oldIndex, newIndex) };
        })
      );
    } else {
      // Move between columns
      const task = sourceCol.tasks.find((t) => t.id === active.id);
      if (!task) return;
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === sourceCol.id) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== active.id) };
          }
          if (col.id === destCol.id) {
            const overIndex = col.tasks.findIndex((t) => t.id === over.id);
            const newTasks = [...col.tasks];
            newTasks.splice(overIndex, 0, task);
            return { ...col, tasks: newTasks };
          }
          return col;
        })
      );
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-3 h-full">
        {columns.map((col) => (
          <div
            key={col.id}
            className="rounded-xl bg-background border border-border-subtle p-3 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {col.title}
              </h4>
              <span className="text-[10px] text-foreground-subtle font-mono">
                {col.tasks.length}
              </span>
            </div>
            <SortableContext
              items={col.tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex-1 space-y-2 min-h-[80px]">
                {col.tasks.map((task) => (
                  <SortableCard key={task.id} task={task} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <OverlayCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
