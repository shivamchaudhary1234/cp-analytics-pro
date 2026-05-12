import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts';
import type { TopicStat } from '../../types';
import { getTopicColor, capitalize } from '../../lib/utils';

interface TopicChartProps {
  data: TopicStat[];
  view?: 'bar' | 'radar';
}

export const TopicChart: React.FC<TopicChartProps> = ({ data, view = 'bar' }) => {
  const top = data.slice(0, 12);

  if (view === 'radar') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={top.slice(0, 8)}>
          <PolarGrid stroke="rgba(48,54,61,0.6)" />
          <PolarAngleAxis
            dataKey="topic"
            tick={{ fill: '#8B949E', fontSize: 10 }}
            tickFormatter={(v) => capitalize(v).slice(0, 8)}
          />
          <Radar name="Solved" dataKey="solved" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.15} strokeWidth={2} />
          <Radar name="Accuracy %" dataKey="accuracy" stroke="#7B2FBE" fill="#7B2FBE" fillOpacity={0.1} strokeWidth={2} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#8B949E' }} />
          <Tooltip
            contentStyle={{ background: 'rgba(33,38,45,0.95)', border: '1px solid #30363D', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#E6EDF3' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={top} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: '#8B949E', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="topic"
          width={100}
          tick={{ fill: '#8B949E', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => capitalize(v)}
        />
        <Tooltip
          contentStyle={{ background: 'rgba(33,38,45,0.95)', border: '1px solid #30363D', borderRadius: '8px', fontSize: '12px' }}
          cursor={{ fill: 'rgba(48,54,61,0.3)' }}
          formatter={(value, name) => [value, name === 'solved' ? 'Solved' : name === 'total' ? 'Total' : String(name)]}
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="rgba(48,54,61,0.8)" name="Total" />
        <Bar dataKey="solved" radius={[0, 4, 4, 0]} name="Solved">
          {top.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getTopicColor(entry.topic)} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

interface AccuracyChartProps {
  data: TopicStat[];
}

export const AccuracyChart: React.FC<AccuracyChartProps> = ({ data }) => {
  const sorted = [...data].sort((a, b) => b.accuracy - a.accuracy).slice(0, 10);

  return (
    <div className="space-y-2.5">
      {sorted.map((topic) => {
        const color = getTopicColor(topic.topic);
        return (
          <div key={topic.topic} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary capitalize">{topic.topic}</span>
              <span style={{ color }} className="font-medium">{topic.accuracy}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${topic.accuracy}%`, background: `linear-gradient(90deg, ${color}60, ${color})` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
