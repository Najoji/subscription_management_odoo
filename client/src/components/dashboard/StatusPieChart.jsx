import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const STATUS_COLORS = {
  Active: '#10b981', // emerald
  Confirmed: '#3b82f6', // blue
  Draft: '#94a3b8', // slate
  Paused: '#f59e0b', // amber
  Closed: '#ef4444', // rose
};

export default function StatusPieChart({ counts = {} }) {
  const data = Object.entries(counts || {})
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count,
    }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No active subscription distribution data
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] || '#6366f1'}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} Subscriptions`, name]}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
