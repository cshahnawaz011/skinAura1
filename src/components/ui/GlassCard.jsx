import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ 
  children, 
  className = '', 
  animate = true,
  delay = 0,
  hover = true,
  onClick
}) {
  const baseClasses = "glass rounded-2xl p-6 shadow-lg";
  const hoverClasses = hover ? "hover:shadow-xl hover:scale-[1.02] transition-all duration-300" : "";
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`${baseClasses} ${hoverClasses} ${className}`}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}