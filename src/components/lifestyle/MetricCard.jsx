import React from 'react';
import { motion } from 'framer-motion';

export default function MetricCard({ icon, title, subtitle, color, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 backdrop-blur-sm"
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        border: `1.5px solid ${color}30`,
      }}
    >
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${color}20` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color }}>{title}</p>
          {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}