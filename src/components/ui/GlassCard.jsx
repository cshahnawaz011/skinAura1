import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const SPARK_COLORS = ['#f472b6','#fbbf24','#a78bfa','#34d399','#60a5fa'];

function Spark({ x, y, color }) {
  return (
    <span
      className="spark"
      style={{
        left: x - 4,
        top: y - 4,
        width: 8,
        height: 8,
        background: color,
        boxShadow: `0 0 6px 2px ${color}`,
      }}
    />
  );
}

export default function GlassCard({
  children,
  className = '',
  animate = true,
  delay = 0,
  hover = true,
  onClick,
  glow = true,
}) {
  const [sparks, setSparks] = useState([]);
  const nextId = useRef(0);

  const addSparks = useCallback((e) => {
    if (!glow) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newSparks = Array.from({ length: 5 }).map(() => ({
      id: nextId.current++,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    }));
    setSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => {
      setSparks(prev => prev.filter(s => !newSparks.find(n => n.id === s.id)));
    }, 1300);
  }, [glow]);

  const baseClasses = `glass rounded-2xl p-6 shadow-lg relative overflow-hidden ${glow ? 'glow-card' : ''}`;
  const hoverClasses = hover ? 'transition-all duration-300 cursor-pointer' : '';

  const content = (
    <>
      {sparks.map(s => <Spark key={s.id} x={s.x} y={s.y} color={s.color} />)}
      {children}
    </>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`${baseClasses} ${hoverClasses} ${className}`}
        onClick={onClick}
        onMouseMove={addSparks}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      onMouseMove={addSparks}
    >
      {content}
    </div>
  );
}