import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FACE_ZONES, SIGNAL_LAYERS } from '@/pages/AdaptiveSkinMap';

function getHeatColor(score, layerColor) {
  // score 0-10, return rgba based on severity
  const alpha = Math.min(0.85, 0.1 + (score / 10) * 0.75);
  return `${layerColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

function getZoneScore(zone, activeLayer, analysis) {
  if (!analysis) return 0;
  const layerCfg = SIGNAL_LAYERS.find(l => l.key === activeLayer);
  if (!layerCfg) return 0;
  const base = analysis[layerCfg.dataKey] || 0;
  // Apply zone-specific modifiers
  const zoneModifiers = {
    forehead: { oiliness: 1.3, acne: 1.1, texture: 1.1 },
    nose: { oiliness: 1.5, texture: 1.3, acne: 1.2 },
    left_cheek: { dryness: 1.2, sensitivity: 1.1, redness: 1.1 },
    right_cheek: { dryness: 1.2, sensitivity: 1.1, redness: 1.1 },
    chin: { acne: 1.3, oiliness: 1.1 },
    undereye: { dryness: 1.4, hydration: 1.3, pigmentation: 1.2 },
  };
  const mod = zoneModifiers[zone.id]?.[activeLayer] || 1.0;
  const val = layerCfg.invert ? Math.max(0, 10 - base) : base;
  return Math.min(10, val * mod);
}

export default function SkinFaceMap({ analysis, activeLayer, selectedZone, onZoneSelect, layerConfig }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Face Outline */}
      <div className="relative w-full max-w-xs mx-auto">
        <svg viewBox="0 0 100 130" className="w-full" style={{ filter: 'drop-shadow(0 8px 24px rgba(200,100,180,0.15))' }}>
          {/* Face shape */}
          <ellipse cx="50" cy="62" rx="34" ry="44"
            fill="rgba(255,240,248,0.8)" stroke="rgba(244,114,182,0.3)" strokeWidth="0.8" />
          {/* Forehead line */}
          <ellipse cx="50" cy="24" rx="26" ry="10"
            fill="rgba(255,240,248,0.4)" stroke="none" />
          {/* Nose */}
          <ellipse cx="50" cy="65" rx="6" ry="8"
            fill="rgba(255,235,245,0.6)" stroke="rgba(244,114,182,0.15)" strokeWidth="0.5" />
          {/* Eyes */}
          <ellipse cx="36" cy="52" rx="6" ry="3" fill="rgba(230,200,240,0.4)" />
          <ellipse cx="64" cy="52" rx="6" ry="3" fill="rgba(230,200,240,0.4)" />
          {/* Eyebrows */}
          <path d="M30 47 Q36 44 42 46" stroke="rgba(180,120,160,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M58 46 Q64 44 70 47" stroke="rgba(180,120,160,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Lips */}
          <path d="M42 88 Q50 92 58 88" stroke="rgba(220,100,150,0.4)" strokeWidth="1" fill="rgba(240,160,190,0.3)" />

          {/* Zone Heatmap Overlays */}
          {FACE_ZONES.map(zone => {
            const score = getZoneScore(zone, activeLayer, analysis);
            const heatColor = getHeatColor(score, layerConfig?.color || '#f472b6');
            const isSelected = selectedZone?.id === zone.id;
            const isHovered = hoveredZone === zone.id;

            return (
              <g key={zone.id}
                onClick={() => onZoneSelect(isSelected ? null : zone)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                style={{ cursor: 'pointer' }}>
                <rect
                  x={zone.x - zone.w / 2}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  rx={zone.w / 4}
                  fill={heatColor}
                  stroke={isSelected ? layerConfig?.color : isHovered ? 'rgba(244,114,182,0.6)' : 'transparent'}
                  strokeWidth={isSelected ? 1 : 0.5}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* Score dot */}
                {(isHovered || isSelected) && (
                  <circle
                    cx={zone.x}
                    cy={zone.y + zone.h / 2}
                    r={3.5}
                    fill={layerConfig?.color || '#f472b6'}
                  />
                )}
              </g>
            );
          })}

          {/* Zone Labels (always show) */}
          {FACE_ZONES.map(zone => {
            const score = getZoneScore(zone, activeLayer, analysis);
            const isSelected = selectedZone?.id === zone.id;
            if (!isSelected) return null;
            return (
              <text key={zone.id + '-label'} x={zone.x} y={zone.y - 2}
                textAnchor="middle" fontSize="3.5" fill={layerConfig?.color || '#f472b6'}
                fontWeight="bold">{zone.label}</text>
            );
          })}
        </svg>

        {/* Floating Zone Badges */}
        <div className="absolute inset-0 pointer-events-none">
          {FACE_ZONES.map(zone => {
            const score = getZoneScore(zone, activeLayer, analysis);
            if (score < 3) return null;
            const severity = score >= 7 ? '🔴' : score >= 5 ? '🟡' : '🟢';
            return (
              <div key={zone.id}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${zone.x}%`,
                  top: `${(zone.y / 130) * 100}%`,
                  transform: 'translate(-50%, -120%)',
                }}
                onClick={() => onZoneSelect(selectedZone?.id === zone.id ? null : zone)}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-full shadow"
                  style={{ background: 'white', border: `1px solid ${layerConfig?.color}`, color: layerConfig?.color }}>
                  {severity} {Math.round(score)}/10
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}