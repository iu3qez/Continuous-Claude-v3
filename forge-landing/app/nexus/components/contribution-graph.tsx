"use client";

import { useState, useMemo } from "react";

const WEEKS = 20;
const DAYS_PER_WEEK = 7;
const CELL_SIZE = 10;
const CELL_GAP = 2;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const COLORS = [
  "#18181b", // 0 - empty
  "#14532d", // 1 - low
  "#16a34a", // 2 - medium
  "#22c55e", // 3 - high
  "#4ade80", // 4 - max
] as const;

function generateContributions(): { date: Date; count: number }[] {
  const data: { date: Date; count: number }[] = [];
  const today = new Date();
  const totalDays = WEEKS * DAYS_PER_WEEK;

  // Start from (totalDays) ago, aligned to Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - totalDays + 1);
  // Align to previous Sunday
  start.setDate(start.getDate() - start.getDay());

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);

    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Seeded pseudo-random based on date
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const rand = ((seed * 9301 + 49297) % 233280) / 233280;

    let count = 0;
    if (isWeekend) {
      // Lower activity on weekends
      if (rand > 0.6) count = Math.floor(rand * 4);
    } else {
      // Higher activity on weekdays
      if (rand > 0.15) count = 1 + Math.floor(rand * 8);
    }

    data.push({ date: d, count });
  }
  return data;
}

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

function formatDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function ContributionGraph() {
  const contributions = useMemo(generateContributions, []);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  // Build week columns
  const weeks: { date: Date; count: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(contributions.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK));
  }

  // Month labels: detect month boundaries
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    if (firstDay) {
      const month = firstDay.date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTH_NAMES[month], weekIndex: wi });
        lastMonth = month;
      }
    }
  });

  const dayLabelWidth = 28;
  const gridWidth = WEEKS * (CELL_SIZE + CELL_GAP);
  const gridHeight = DAYS_PER_WEEK * (CELL_SIZE + CELL_GAP);
  const monthLabelHeight = 14;

  return (
    <div className="flex flex-col border border-border-subtle rounded-sm bg-surface p-3">
      {/* Section header */}
      <div className="mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
          Team Activity
        </span>
      </div>

      {/* Graph container */}
      <div className="relative" style={{ userSelect: "none" }}>
        {/* Month labels row */}
        <div
          className="flex text-[10px] font-mono text-foreground-subtle"
          style={{ paddingLeft: dayLabelWidth, height: monthLabelHeight }}
        >
          {monthLabels.map(({ label, weekIndex }) => (
            <span
              key={`${label}-${weekIndex}`}
              className="absolute"
              style={{ left: dayLabelWidth + weekIndex * (CELL_SIZE + CELL_GAP) }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid area */}
        <div className="flex">
          {/* Day labels */}
          <div
            className="flex flex-col text-[10px] font-mono text-foreground-subtle"
            style={{ width: dayLabelWidth }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex items-center"
                style={{ height: CELL_SIZE + CELL_GAP }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => {
                  const level = getLevel(day.count);
                  return (
                    <div
                      key={di}
                      className="rounded-[2px]"
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor: COLORS[level],
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parentRect =
                          e.currentTarget.closest(".relative")?.getBoundingClientRect();
                        if (parentRect) {
                          setTooltip({
                            x: rect.left - parentRect.left + CELL_SIZE / 2,
                            y: rect.top - parentRect.top - 4,
                            date: formatDate(day.date),
                            count: day.count,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip (CSS only positioning, React state for visibility) */}
        {tooltip && (
          <div
            className="absolute z-10 px-2 py-1 text-[10px] font-mono text-foreground bg-surface-elevated border border-border-subtle rounded-sm whitespace-nowrap pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <span className="text-foreground-muted">{tooltip.date}</span>
            {" -- "}
            <span className="text-foreground">
              {tooltip.count} contribution{tooltip.count !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] font-mono text-foreground-subtle mr-1">Less</span>
        {COLORS.map((color, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: color }}
          />
        ))}
        <span className="text-[10px] font-mono text-foreground-subtle ml-1">More</span>
      </div>
    </div>
  );
}
