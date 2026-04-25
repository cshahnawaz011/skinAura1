import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FACE_ZONES, SIGNAL_LAYERS } from '@/pages/AdaptiveSkinMap';

// ── Detailed zone shapes mapped precisely to a face silhouette ────────────────
const ZONE_PATHS = {
  forehead: {
    path: 'M 28 28 Q 50 16 72 28 Q 74 38 72 42 Q 50 36 28 42 Q 26 38 28 28 Z',
    labelX: 50, labelY: 26,
    cx: 50, cy: 33,
  },
  left_brow_temple: {
    path: 'M 14 38 Q 20 34 30 36 Q 30 46 24 50 Q 16 46 14 38 Z',
    labelX: 22, labelY: 43,
    cx: 22, cy: 43,
  },
  right_brow_temple: {
    path: 'M 86 38 Q 80 34 70 36 Q 70 46 76 50 Q 84 46 86 38 Z',
    labelX: 78, labelY: 43,
    cx: 78, cy: 43,
  },
  nose: {
    path: 'M 44 52 Q 50 50 56 52 Q 60 62 58 70 Q 54 74 50 74 Q 46 74 42 70 Q 40 62 44 52 Z',
    labelX: 50, labelY: 62,
    cx: 50, cy: 62,
  },
  left_cheek: {
    path: 'M 14 54 Q 18 50 28 52 Q 36 56 38 66 Q 36 76 28 80 Q 18 78 14 70 Q 12 62 14 54 Z',
    labelX: 25, labelY: 65,
    cx: 25, cy: 65,
  },
  right_cheek: {
    path: 'M 86 54 Q 82 50 72 52 Q 64 56 62 66 Q 64 76 72 80 Q 82 78 86 70 Q 88 62 86 54 Z',
    labelX: 75, labelY: 65,
    cx: 75, cy: 65,
  },
  undereye: {
    path: 'M 22 58 Q 34 54 42 58 Q 42 64 34 66 Q 24 64 22 58 Z M 58 58 Q 66 54 78 58 Q 78 64 70 66 Q 60 64 58 58 Z',
    labelX: 50, labelY: 61,
    cx: 50, cy: 61,
  },
  chin: {
    path: 'M 34 88 Q 50 84 66 88 Q 68 96 64 104 Q 56 110 50 110 Q 44 110 36 104 Q 32 96 34 88 Z',
    labelX: 50, labelY: 97,
    cx: 50, cy: 97,
  },
  lips_perioral: {
    path: 'M 38 78 Q 50 74 62 78 Q 64 84 62 88 Q 50 92 38 88 Q 36 84 38 78 Z',
    labelX: 50, labelY: 83,
    cx: 50, cy: 83,
  },
};

const ZONE_META = {
  forehead: { label: 'Forehead', emoji: '⬆️', signals: ['oiliness', 'acne', 'texture'], modifiers: { oiliness: 1.35, acne: 1.15, texture: 1.2 } },
  left_brow_temple: { label: 'Left Temple', emoji: '◀', signals: ['redness', 'sensitivity'], modifiers: { redness: 1.1, sensitivity: 1.1 } },
  right_brow_temple: { label: 'Right Temple', emoji: '▶', signals: ['redness', 'sensitivity'], modifiers: { redness: 1.1, sensitivity: 1.1 } },
  nose: { label: 'T-Zone / Nose', emoji: '👃', signals: ['oiliness', 'texture', 'acne'], modifiers: { oiliness: 1.6, texture: 1.4, acne: 1.25 } },
  left_cheek: { label: 'Left Cheek', emoji: '◀️', signals: ['dryness', 'sensitivity', 'redness'], modifiers: { dryness: 1.3, sensitivity: 1.2, redness: 1.15 } },
  right_cheek: { label: 'Right Cheek', emoji: '▶️', signals: ['dryness', 'sensitivity', 'redness'], modifiers: { dryness: 1.3, sensitivity: 1.2, redness: 1.15 } },
  undereye: { label: 'Under Eye', emoji: '👁️', signals: ['dryness', 'hydration', 'pigmentation'], modifiers: { dryness: 1.45, hydration: 1.4, pigmentation: 1.3 } },
  chin: { label: 'Chin & Jaw', emoji: '⬇️', signals: ['acne', 'oiliness'], modifiers: { acne: 1.35, oiliness: 1.15 } },
  lips_perioral: { label: 'Perioral Zone', emoji: '💋', signals: ['dryness', 'sensitivity'], modifiers: { dryness: 1.2, sensitivity: 1.1 } },
};

function getZoneScore(zoneId, activeLayer, analysis) {
  if (!analysis) return 0;
  const layerCfg = SIGNAL_LAYERS.find(l => l.key === activeLayer);
  if (!layerCfg) return 0;
  const base = analysis[layerCfg.dataKey] || 0;
  const val = layerCfg.invert ? Math.max(0, 10 - base) : base;
  const mod = ZONE_META[zoneId]?.modifiers?.[activeLayer] || 0.9;
  return Math.min(10, val * mod);
}

function scoreToColor(score, layerColor) {
  // Returns a hex color with alpha channel embedded in rgba
  const alpha = 0.08 + (score / 10) * 0.72;
  // parse hex color
  const r = parseInt(layerColor.slice(1, 3), 16);
  const g = parseInt(layerColor.slice(3, 5), 16);
  const b = parseInt(layerColor.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function scoreToStroke(score, layerColor) {
  const alpha = 0.15 + (score / 10) * 0.7;
  const r = parseInt(layerColor.slice(1, 3), 16);
  const g = parseInt(layerColor.slice(3, 5), 16);
  const b = parseInt(layerColor.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Animated scan line effect
function ScanLine({ color }) {
  return (
    <motion.line
      x1="10" y1="0" x2="90" y2="0"
      stroke={color}
      strokeWidth="0.5"
      strokeOpacity="0.4"
      initial={{ y1: 20, y2: 20, opacity: 0.8 }}
      animate={{ y1: [20, 115, 20], y2: [20, 115, 20], opacity: [0.6, 0.3, 0.6] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Pulsing ring for high-severity zones
function PulsingRing({ cx, cy, color, score }) {
  if (score < 6) return null;
  return (
    <>
      <motion.circle cx={cx} cy={cy} r={score >= 8 ? 9 : 7}
        fill="none" stroke={color} strokeWidth="0.8"
        initial={{ opacity: 0.8, scale: 0.8 }}
        animate={{ opacity: [0.8, 0, 0.8], scale: [0.8, 1.5, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {score >= 8 && (
        <motion.circle cx={cx} cy={cy} r={12}
          fill="none" stroke={color} strokeWidth="0.4"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0, 0.5], scale: [0.9, 1.8, 0.9] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
      )}
    </>
  );
}

export default function SkinFaceMap({ analysis, activeLayer, selectedZone, onZoneSelect, layerConfig }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [scanActive, setScanActive] = useState(true);
  const [animTick, setAnimTick] = useState(0);

  // Tick for micro-animation updates
  useEffect(() => {
    const interval = setInterval(() => setAnimTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  const color = layerConfig?.color || '#f472b6';
  const zoneIds = Object.keys(ZONE_PATHS);

  return (
    <div className="relative select-none">
      {/* Control bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div className="w-2 h-2 rounded-full" style={{ background: color }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Live Diagnostic Mode</span>
        </div>
        <button onClick={() => setScanActive(s => !s)}
          className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
          style={{ background: scanActive ? `${color}18` : 'rgba(0,0,0,0.05)', color: scanActive ? color : '#9ca3af', border: `1px solid ${scanActive ? color + '44' : 'transparent'}` }}>
          {scanActive ? '⚡ Scan ON' : '⚫ Scan OFF'}
        </button>
      </div>

      {/* Main SVG Face Map */}
      <div className="relative w-full max-w-sm mx-auto">
        <svg viewBox="0 0 100 120" className="w-full"
          style={{ filter: `drop-shadow(0 12px 32px ${color}22)` }}>
          <defs>
            {/* Radial gradient for face skin */}
            <radialGradient id="faceGrad" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="rgba(255,242,250,1)" />
              <stop offset="100%" stopColor="rgba(245,225,240,0.85)" />
            </radialGradient>
            {/* Glow filter for selected zone */}
            <filter id="zoneGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Active layer gradient */}
            <radialGradient id="activeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Face base shape */}
          <ellipse cx="50" cy="62" rx="38" ry="50"
            fill="url(#faceGrad)"
            stroke={`${color}30`}
            strokeWidth="0.5"
          />
          {/* Forehead bump */}
          <ellipse cx="50" cy="20" rx="30" ry="12" fill="url(#faceGrad)" stroke="none" />

          {/* Scan line overlay */}
          {scanActive && <ScanLine color={color} />}

          {/* Grid overlay (subtle diagnostic grid) */}
          {[30, 50, 70, 90].map(y => (
            <line key={y} x1="12" y1={y} x2="88" y2={y}
              stroke={color} strokeOpacity="0.04" strokeWidth="0.3" strokeDasharray="1,3" />
          ))}
          {[25, 50, 75].map(x => (
            <line key={x} x1={x} y1="15" x2={x} y2="115"
              stroke={color} strokeOpacity="0.04" strokeWidth="0.3" strokeDasharray="1,3" />
          ))}

          {/* Zone heatmap paths */}
          {zoneIds.map(zoneId => {
            const zonePath = ZONE_PATHS[zoneId];
            const meta = ZONE_META[zoneId];
            const score = getZoneScore(zoneId, activeLayer, analysis);
            const fillColor = scoreToColor(score, color);
            const strokeColor = scoreToStroke(score, color);
            const isSelected = selectedZone?.id === zoneId;
            const isHovered = hoveredZone === zoneId;
            const isHighSeverity = score >= 6;

            return (
              <g key={zoneId}
                onClick={() => onZoneSelect(isSelected ? null : { id: zoneId, ...meta, ...zonePath })}
                onMouseEnter={() => setHoveredZone(zoneId)}
                onMouseLeave={() => setHoveredZone(null)}
                style={{ cursor: 'pointer' }}>

                {/* Heat fill */}
                <motion.path
                  d={zonePath.path}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 1.2 : isHovered ? 0.8 : 0.4}
                  filter={isSelected ? 'url(#zoneGlow)' : undefined}
                  animate={{
                    fill: fillColor,
                    strokeWidth: isSelected ? 1.2 : isHovered ? 0.8 : 0.4,
                  }}
                  transition={{ duration: 0.4 }}
                />

                {/* Pulsing rings for high-severity zones */}
                <PulsingRing cx={zonePath.cx} cy={zonePath.cy} color={color} score={score} />

                {/* Center dot / severity marker */}
                {score > 0 && (
                  <motion.circle
                    cx={zonePath.cx}
                    cy={zonePath.cy}
                    r={isSelected ? 2.8 : isHovered ? 2.4 : isHighSeverity ? 2 : 1.4}
                    fill={color}
                    fillOpacity={0.3 + (score / 10) * 0.6}
                    animate={{ r: isSelected ? 2.8 : isHovered ? 2.4 : isHighSeverity ? 2 : 1.4 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Score label on hover/select */}
                {(isHovered || isSelected) && (
                  <g>
                    <rect x={zonePath.labelX - 8} y={zonePath.labelY - 5.5} width={16} height={7} rx={3.5}
                      fill="white" stroke={color} strokeWidth="0.5" opacity="0.96" />
                    <text x={zonePath.labelX} y={zonePath.labelY - 0.5}
                      textAnchor="middle" fontSize="3.8" fill={color} fontWeight="bold">
                      {score.toFixed(1)}/10
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Facial feature details */}
          {/* Eyes */}
          <ellipse cx="32" cy="54" rx="7" ry="3.5" fill="rgba(60,40,80,0.12)" stroke="rgba(100,60,120,0.2)" strokeWidth="0.4" />
          <ellipse cx="68" cy="54" rx="7" ry="3.5" fill="rgba(60,40,80,0.12)" stroke="rgba(100,60,120,0.2)" strokeWidth="0.4" />
          <ellipse cx="32" cy="54" rx="3" ry="3" fill="rgba(40,20,60,0.25)" />
          <ellipse cx="68" cy="54" rx="3" ry="3" fill="rgba(40,20,60,0.25)" />
          {/* Eye shine */}
          <circle cx="33.5" cy="52.5" r="0.9" fill="white" opacity="0.7" />
          <circle cx="69.5" cy="52.5" r="0.9" fill="white" opacity="0.7" />
          {/* Eyebrows */}
          <path d="M 25 48 Q 32 45 39 47" stroke="rgba(80,40,80,0.3)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 61 47 Q 68 45 75 48" stroke="rgba(80,40,80,0.3)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Nose bridge */}
          <path d="M 47 58 Q 44 66 46 72 M 53 58 Q 56 66 54 72" stroke="rgba(180,120,160,0.2)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
          {/* Nostrils */}
          <ellipse cx="46" cy="73" rx="2.5" ry="1.5" fill="rgba(160,100,140,0.2)" />
          <ellipse cx="54" cy="73" rx="2.5" ry="1.5" fill="rgba(160,100,140,0.2)" />
          {/* Lips */}
          <path d="M 39 80 Q 44 77 50 78 Q 56 77 61 80 Q 58 86 50 88 Q 42 86 39 80 Z"
            fill="rgba(220,120,160,0.25)" stroke="rgba(200,100,140,0.3)" strokeWidth="0.4" />
          <path d="M 39 80 Q 50 83 61 80" stroke="rgba(200,100,140,0.25)" strokeWidth="0.4" fill="none" />
          {/* Ears */}
          <ellipse cx="12" cy="62" rx="4" ry="8" fill="rgba(255,230,245,0.8)" stroke="rgba(220,160,200,0.3)" strokeWidth="0.5" />
          <ellipse cx="88" cy="62" rx="4" ry="8" fill="rgba(255,230,245,0.8)" stroke="rgba(220,160,200,0.3)" strokeWidth="0.5" />
          {/* Neck */}
          <rect x="38" y="110" width="24" height="10" rx="4" fill="rgba(255,235,248,0.6)" />
        </svg>

        {/* Floating severity badges — positioned absolutely over SVG */}
        <div className="absolute inset-0 pointer-events-none">
          {zoneIds.map(zoneId => {
            const zonePath = ZONE_PATHS[zoneId];
            const score = getZoneScore(zoneId, activeLayer, analysis);
            if (score < 4) return null;
            const xPct = (zonePath.cx / 100) * 100;
            const yPct = (zonePath.cy / 120) * 100;
            const isSelected = selectedZone?.id === zoneId;
            if (isSelected) return null; // shown inline in SVG

            const badgeColor = score >= 8 ? '#ef4444' : score >= 6 ? '#f97316' : score >= 4 ? '#facc15' : '#34d399';
            return (
              <motion.div key={zoneId}
                className="absolute pointer-events-auto cursor-pointer"
                style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -200%)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                onClick={() => onZoneSelect({ id: zoneId, ...ZONE_META[zoneId], ...zonePath })}>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shadow-md text-white"
                  style={{ background: badgeColor, fontSize: '8px', fontWeight: 900, lineHeight: 1.4 }}>
                  {score >= 8 ? '🔴' : score >= 6 ? '🟠' : '🟡'} {score.toFixed(1)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom zone selector chips */}
      <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
        {zoneIds.map(zoneId => {
          const meta = ZONE_META[zoneId];
          const score = getZoneScore(zoneId, activeLayer, analysis);
          const isSelected = selectedZone?.id === zoneId;
          const bgAlpha = 0.1 + (score / 10) * 0.2;
          return (
            <button key={zoneId}
              onClick={() => onZoneSelect(isSelected ? null : { id: zoneId, ...meta, ...ZONE_PATHS[zoneId] })}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all"
              style={{
                background: isSelected ? color : `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${bgAlpha})`,
                color: isSelected ? 'white' : color,
                border: `1px solid ${color}${isSelected ? 'ff' : '44'}`,
              }}>
              {meta.emoji} {meta.label}
              <span className="ml-0.5 opacity-80">{score.toFixed(1)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}