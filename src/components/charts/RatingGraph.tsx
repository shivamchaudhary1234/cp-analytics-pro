import React from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import type { CFRatingChange } from '../../types';
import { getRankColor } from '../../lib/utils';

interface RatingGraphProps {
  data: CFRatingChange[];
  currentRating: number;
  currentRank: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CFRatingChange;
  return (
    <div className="glass-card px-3 py-2 text-xs space-y-1 shadow-lg">
      <p className="font-semibold text-text-primary">{d.contestName}</p>
      <p className="text-text-secondary">Rank: #{d.rank}</p>
      <p style={{ color: d.delta >= 0 ? '#3FB950' : '#F85149' }} className="font-medium">
        {d.delta >= 0 ? '+' : ''}{d.delta}
      </p>
      <p className="text-accent-cyan font-bold">{d.rating}</p>
    </div>
  );
};

export const RatingGraph: React.FC<RatingGraphProps> = ({ data, currentRating, currentRank }) => {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-text-secondary text-sm">No contest history yet</div>
  );

  const minRating = Math.min(...data.map((d) => d.rating)) - 100;
  const maxRating = Math.max(...data.map((d) => d.rating)) + 100;

  // Rating band lines (Codeforces rating thresholds)
  const bands = [
    { rating: 1200, label: 'Pupil', color: '#008000' },
    { rating: 1400, label: 'Specialist', color: '#1EFF00' },
    { rating: 1600, label: 'Expert', color: '#0070DD' },
    { rating: 1900, label: 'Candidate Master', color: '#AA00AA' },
    { rating: 2100, label: 'Master', color: '#FF8C00' },
    { rating: 2400, label: 'Grandmaster', color: '#FF3333' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold" style={{ color: getRankColor(currentRank) }}>{currentRating}</span>
        <div>
          <p className="text-xs font-medium capitalize" style={{ color: getRankColor(currentRank) }}>{currentRank}</p>
          <p className="text-xs text-text-muted">{data.length} contests</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,0.4)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#8B949E', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#30363D' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minRating, maxRating]}
            tick={{ fill: '#8B949E', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          {bands
            .filter((b) => b.rating >= minRating && b.rating <= maxRating)
            .map((b) => (
              <ReferenceLine
                key={b.rating}
                y={b.rating}
                stroke={b.color}
                strokeDasharray="4 4"
                strokeOpacity={0.3}
                label={{ value: b.label, fill: b.color, fontSize: 9, position: 'insideTopRight' }}
              />
            ))}
          <Area
            type="monotone"
            dataKey="rating"
            stroke="#00D4FF"
            strokeWidth={2}
            fill="url(#ratingGradient)"
            dot={(props) => {
              const { cx, cy, payload } = props;
              const color = (payload as CFRatingChange).delta >= 0 ? '#3FB950' : '#F85149';
              return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
            }}
            activeDot={{ r: 6, fill: '#00D4FF', stroke: '#0D1117', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
