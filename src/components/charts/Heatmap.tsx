import React, { useState } from 'react';
import type { DailyStat } from '../../types';

interface HeatmapProps {
  data: DailyStat[];
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCellColor(count: number): string {
  if (count === 0) return 'rgba(33,38,45,0.8)';
  if (count === 1) return 'rgba(0,212,255,0.2)';
  if (count === 2) return 'rgba(0,212,255,0.4)';
  if (count <= 4) return 'rgba(0,212,255,0.65)';
  return 'rgba(0,212,255,0.9)';
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Group into weeks
  const weeks: DailyStat[][] = [];
  let week: DailyStat[] = [];

  // Pad start of first week
  const firstDate = new Date(data[0]?.date ?? new Date());
  const firstDow = firstDate.getDay(); // 0=Sun
  for (let i = 0; i < firstDow; i++) week.push({ date: '', count: -1 }); // empty filler

  for (const day of data) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: '', count: -1 });
    weeks.push(week);
  }

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((wk, col) => {
    const first = wk.find((d) => d.date && d.count >= 0);
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTHS[m], col });
      lastMonth = m;
    }
  });

  const totalSolved = data.reduce((a, b) => a + Math.max(0, b.count), 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span><span className="text-text-primary font-semibold">{totalSolved}</span> submissions in the last year</span>
        <span><span className="text-text-primary font-semibold">{activeDays}</span> active days</span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 ml-8">
            {monthLabels.map(({ label, col }) => (
              <div key={`${label}-${col}`} className="text-[10px] text-text-muted" style={{ marginLeft: `${col * 13}px`, position: col === 0 ? 'relative' : 'absolute' }}>
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day of week labels */}
            <div className="flex flex-col gap-1 mr-1">
              {WEEK_DAYS.map((d, i) => (
                <div key={d} className="h-[11px] text-[9px] text-text-muted leading-none flex items-center">
                  {i % 2 === 1 ? d.charAt(0) : ''}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex gap-1">
              {weeks.map((wk, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {wk.map((day, di) => (
                    <div
                      key={di}
                      className="heatmap-cell w-[11px] h-[11px] rounded-sm transition-transform"
                      style={{
                        background: day.count < 0 ? 'transparent' : getCellColor(day.count),
                        border: day.count >= 0 ? '1px solid rgba(48,54,61,0.4)' : 'none',
                        cursor: day.count >= 0 ? 'pointer' : 'default',
                      }}
                      onMouseEnter={(e) => {
                        if (day.count >= 0) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({ date: day.date, count: day.count, x: rect.left, y: rect.top - 30 });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-3 h-3 rounded-sm"
            style={{ background: getCellColor(level === 0 ? 0 : level === 1 ? 1 : level === 2 ? 2 : level === 3 ? 3 : 5) }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="tooltip fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.count} submission{tooltip.count !== 1 ? 's' : ''} on {new Date(tooltip.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
    </div>
  );
};
