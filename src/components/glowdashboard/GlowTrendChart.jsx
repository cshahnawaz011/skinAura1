import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export default function GlowTrendChart({ data = [] }) {
  if (data.length < 2) return (
    <div className="h-32 flex items-center justify-center text-sm text-gray-400">
      Log at least 2 days to see your trend 📈
    </div>
  );

  const chartData = data.map(d => ({
    day: format(new Date(d.date + 'T00:00:00'), 'EEE'),
    score: d.glow_score || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={130}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          formatter={(v) => [`${v} pts`, 'Glow Score']}
        />
        <Area type="monotone" dataKey="score" stroke="#f43f5e" strokeWidth={2.5} fill="url(#glowGrad)" dot={{ fill: '#f43f5e', r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}