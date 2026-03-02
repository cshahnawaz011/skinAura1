import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const colors = ['#f472b6', '#fbbf24', '#6ee7b7', '#60a5fa', '#a78bfa'];

export default function Confetti({ trigger }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 10 + 5,
      }));
      setParticles(newParticles);
      
      setTimeout(() => setParticles([]), 3000);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            x: particle.x, 
            y: -20, 
            rotate: 0,
            opacity: 1 
          }}
          animate={{ 
            y: window.innerHeight + 20, 
            rotate: 720,
            opacity: 0 
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 2 + Math.random(), 
            delay: particle.delay,
            ease: 'easeIn'
          }}
          className="fixed pointer-events-none z-50"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </AnimatePresence>
  );
}