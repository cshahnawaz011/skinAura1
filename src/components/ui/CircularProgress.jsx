import React from 'react';
import { motion } from 'framer-motion';

export default function CircularProgress({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 10,
  showLabel = true,
  label,
  color = 'pink'
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = (value / max) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  const colors = {
    pink: { stroke: '#f472b6', bg: '#fce7f3' },
    mint: { stroke: '#6ee7b7', bg: '#d1fae5' },
    gold: { stroke: '#fbbf24', bg: '#fef3c7' },
    red: { stroke: '#f87171', bg: '#fee2e2' },
    blue: { stroke: '#60a5fa', bg: '#dbeafe' },
  };

  const colorSet = colors[color] || colors.pink;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="circular-progress">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorSet.bg}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorSet.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-2xl font-bold text-gray-800 dark:text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(value)}
          </motion.span>
          {label && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}