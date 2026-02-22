"use client";

import { useState, useMemo } from "react";
import {
  format,
  differenceInDays,
  addDays,
  startOfWeek,
  eachDayOfInterval,
} from "date-fns";

/* ---- Types ---- */

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  color: string;
  progress: number;
  assignee?: string;
}

/* ---- Initial data ---- */

const BASE = startOfWeek(new Date(), { weekStartsOn: 1 });

const INITIAL_TASKS: GanttTask[] = [
  {
    id: "g1",
    name: "Research & Scoping",
    start: BASE,
    end: addDays(BASE, 4),
    color: "bg-violet-500",
    progress: 100,
    assignee: "AK",
  },
  {
    id: "g2",
    name: "Architecture Design",
    start: addDays(BASE, 3),
    end: addDays(BASE, 7),
    color: "bg-amber-500",
    progress: 75,
    assignee: "MR",
  },
  {
    id: "g3",
    name: "API Development",
    start: addDays(BASE, 6),
    end: addDays(BASE, 13),
    color: "bg-emerald-500",
    progress: 40,
    assignee: "JL",
  },
  {
    id: "g4",
    name: "Frontend Build",
    start: addDays(BASE, 8),
    end: addDays(BASE, 16),
    color: "bg-blue-500",
    progress: 20,
    assignee: "SR",
  },
  {
    id: "g5",
    name: "QA & Testing",
    start: addDays(BASE, 14),
    end: addDays(BASE, 19),
    color: "bg-rose-500",
    progress: 0,
  },
  {
    id: "g6",
    name: "Launch Prep",
    start: addDays(BASE, 18),
    end: addDays(BASE, 20),
    color: "bg-accent",
    progress: 0,
  },
];

/* ---- Component ---- */

export default function GanttDemo() {
  const [tasks] = useState<GanttTask[]>(INITIAL_TASKS);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const { timeline, totalDays, chartStart } = useMemo(() => {
    const chartStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const chartEnd = addDays(chartStart, 20);
    const totalDays = differenceInDays(chartEnd, chartStart) + 1;
    const timeline = eachDayOfInterval({ start: chartStart, end: chartEnd });
    return { timeline, totalDays, chartStart };
  }, []);

  function getBarStyle(task: GanttTask) {
    const startOffset = differenceInDays(task.start, chartStart);
    const duration = differenceInDays(task.end, task.start) + 1;
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return { left: `${left}%`, width: `${width}%` };
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header: Day labels */}
      <div className="flex border-b border-border-subtle pb-2 mb-1">
        <div className="w-40 shrink-0" />
        <div className="flex-1 flex">
          {timeline.map((day, i) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={i}
                className={`flex-1 text-center text-[9px] font-mono uppercase tracking-wider ${
                  isWeekend ? "text-foreground-subtle/40" : "text-foreground-subtle"
                }`}
              >
                {format(day, "EEE")}
                <div className="text-[8px] text-foreground-subtle/50 mt-0.5">
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center h-10 group"
            onMouseEnter={() => setHoveredTask(task.id)}
            onMouseLeave={() => setHoveredTask(null)}
          >
            {/* Label */}
            <div className="w-40 shrink-0 flex items-center gap-2 pr-3">
              {task.assignee && (
                <div className="w-5 h-5 rounded-full bg-surface-elevated border border-border-subtle text-[8px] font-bold flex items-center justify-center text-foreground-muted">
                  {task.assignee}
                </div>
              )}
              <span className="text-xs text-foreground-muted truncate">
                {task.name}
              </span>
            </div>

            {/* Chart area */}
            <div className="flex-1 relative h-full">
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {timeline.map((day, i) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`flex-1 border-r border-border-subtle/30 ${
                        isWeekend ? "bg-foreground-subtle/[0.02]" : ""
                      }`}
                    />
                  );
                })}
              </div>

              {/* Bar */}
              <div
                className="gantt-bar absolute top-1.5 bottom-1.5 rounded-md overflow-hidden cursor-default"
                style={getBarStyle(task)}
              >
                {/* Background */}
                <div className={`absolute inset-0 ${task.color} opacity-20`} />
                {/* Progress fill */}
                <div
                  className={`absolute inset-y-0 left-0 ${task.color} opacity-60 transition-all duration-300`}
                  style={{ width: `${task.progress}%` }}
                />
                {/* Label on bar */}
                <div className="relative z-10 flex items-center h-full px-2">
                  <span className="text-[10px] font-medium text-foreground truncate">
                    {task.progress > 0 && `${task.progress}%`}
                  </span>
                </div>
                {/* Hover highlight */}
                {hoveredTask === task.id && (
                  <div className="absolute inset-0 bg-white/5" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today indicator */}
      <div className="flex mt-2 pt-2 border-t border-border-subtle">
        <div className="w-40 shrink-0" />
        <div className="flex-1 relative">
          {(() => {
            const todayOffset = differenceInDays(new Date(), chartStart);
            if (todayOffset < 0 || todayOffset > totalDays) return null;
            const left = ((todayOffset + 0.5) / totalDays) * 100;
            return (
              <div
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${left}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-[8px] font-mono text-accent mt-0.5">
                  Today
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
