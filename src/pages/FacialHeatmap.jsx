import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Droplets, FlaskConical, ShoppingBag, AlertCircle, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

// ─── Zone definitions ─────────────────────────────────────────────────────────
const ZONES = [
  {
    id: 'forehead',
    label: 'Forehead',
    emoji: '🔝',
    cx: 200, cy: 110, rx: 85, ry: 52,
    color: '#f43f5e',
    concerns: ['oiliness', 'acne_level', 'pores'],
    desc: 'Largest sebaceous zone — prone to T-zone shine and breakouts.',
  },
  {
    id: 'left_cheek',
    label: 'Left Cheek',
    emoji: '🫧',
    cx: 95, cy: 215, rx: 62, ry: 68,
    color: '#a78bfa',
    concerns: ['redness', 'dryness', 'sensitivity'],
    desc: 'Often dryer — exposed to phone contact and environmental triggers.',
  },
  {
    id: 'right_cheek',
    label: 'Right Cheek',
    emoji: '🫧',
    cx: 305, cy: 215, rx: 62, ry: 68,
    color: '#a78bfa',
    concerns: ['redness', 'dryness', 'dark_spots'],
    desc: 'Sun-exposed — prone to hyperpigmentation and capillary redness.',
  },
  {
    id: 'nose',
    label: 'Nose & T-Zone',
    emoji: '👃',
    cx: 200, cy: 220, rx: 36, ry: 58,
    color: '#f59e0b',
    concerns: ['oiliness', 'pores', 'acne_level'],
    desc: 'Highest density of oil glands — blackheads and enlarged pores are common.',
  },
  {
    id: 'eye_left',
    label: 'Left Eye Area',
    emoji: '👁️',
    cx: 132, cy: 168, rx: 40, ry: 26,
    color: '#06b6d4',
    concerns: ['wrinkles', 'dark_spots', 'sensitivity'],
    desc: 'Thinnest skin on the face — first area to show fine lines and dark circles.',
  },
  {
    id: 'eye_right',
    label: 'Right Eye Area',
    emoji: '👁️',
    cx: 268, cy: 168, rx: 40, ry: 26,
    color: '#06b6d4',
    concerns: ['wrinkles', 'dark_spots', 'sensitivity'],
    desc: 'Same as left — needs dedicated peptide or retinol eye cream.',
  },
  {
    id: 'chin',
    label: 'Chin & Jawline',
    emoji: '🫦',
    cx: 200, cy: 320, rx: 60, ry: 42,
    color: '#10b981',
    concerns: ['acne_level', 'oiliness', 'sensitivity'],
    desc: 'Hormonal acne zone — flares with stress and menstrual cycles.',
  },
  {
    id: 'lips',
    label: 'Lip Area',
    emoji: '💋',
    cx: 200, cy: 285, rx: 34, ry: 20,
    color: '#ec4899',
    concerns: ['dryness', 'sensitivity'],
    desc: 'No sebaceous glands — requires constant moisture barrier support.',
  },
];

const CONCERN_LABELS = {
  oiliness: 'Oiliness',
  acne_level: 'Acne',
  pores: 'Enlarged Pores',
  redness: 'Redness',
  dryness: 'Dryness',
  sensitivity: 'Sensitivity',
  wrinkles: 'Wrinkles',
  dark_spots: 'Dark Spots',
};

function getSeverityColor(score) {
  if (!score && score !== 0) return '#94a3b8';
  if (score <= 3) return '#10b981';
  if (score <= 6) return '#f59e0b';
  return '#f43f5e';
}

function getSeverityLabel(score) {
  if (!score && score !== 0) return 'N/A';
  if (score <= 3) return 'Healthy';
  if (score <= 6) return 'Moderate';
  return 'High';
}

function FaceModel({ zones, analysis, activeZone, onZoneClick, hovered, setHovered }) {
  return (
    <svg
      viewBox="0 0 400 420"
      className="w-full max-w-xs mx-auto drop-shadow-2xl select-none"
      style={{ filter: 'drop-shadow(0 8px 48px rgba(220,60,130,0.18))' }}
    >
      {/* Face shape */}
      <defs>
        <radialGradient id="faceGrad" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffe4d6" />
          <stop offset="100%" stopColor="#f8c4a0" />
        </radialGradient>
        <radialGradient id="faceGradDark" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#4a2820" />
          <stop offset="100%" stopColor="#2d1a10" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Neck */}
      <rect x="160" y="365" width="80" height="50" rx="20" fill="url(#faceGrad)" opacity="0.6" />

      {/* Face oval */}
      <ellipse cx="200" cy="215" rx="155" ry="195" fill="url(#faceGrad)" />

      {/* Subtle ear shapes */}
      <ellipse cx="46" cy="210" rx="16" ry="26" fill="#f0b899" />
      <ellipse cx="354" cy="210" rx="16" ry="26" fill="#f0b899" />

      {/* Hair area */}
      <ellipse cx="200" cy="68" rx="152" ry="68" fill="#3d2314" opacity="0.85" />
      <ellipse cx="200" cy="38" rx="120" ry="40" fill="#2e1a0e" />

      {/* Eyebrows */}
      <path d="M110 148 Q132 138 155 146" stroke="#3d2314" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M245 146 Q268 138 290 148" stroke="#3d2314" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Eyes */}
      <ellipse cx="132" cy="168" rx="24" ry="14" fill="white" />
      <ellipse cx="268" cy="168" rx="24" ry="14" fill="white" />
      <circle cx="132" cy="168" r="9" fill="#3d2314" />
      <circle cx="268" cy="168" r="9" fill="#3d2314" />
      <circle cx="136" cy="165" r="3" fill="white" />
      <circle cx="272" cy="165" r="3" fill="white" />

      {/* Nose */}
      <path d="M195 200 Q185 230 178 242 Q190 250 200 248 Q210 250 222 242 Q215 230 205 200" fill="#e8a882" opacity="0.7" />
      <ellipse cx="182" cy="242" rx="10" ry="7" fill="#d4906a" opacity="0.6" />
      <ellipse cx="218" cy="242" rx="10" ry="7" fill="#d4906a" opacity="0.6" />

      {/* Mouth */}
      <path d="M168 283 Q200 300 232 283" stroke="#c47a5a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M174 280 Q200 272 226 280 Q200 293 174 280Z" fill="#e07b6a" opacity="0.8" />

      {/* ── Heatmap zone overlays ── */}
      {zones.map((zone) => {
        const isActive = activeZone?.id === zone.id;
        const isHovered = hovered === zone.id;

        // Get worst score from related concerns
        const scores = zone.concerns.map(c => analysis?.[c] ?? 0);
        const maxScore = Math.max(...scores);
        const heatColor = analysis ? getSeverityColor(maxScore) : zone.color;

        return (
          <g key={zone.id}>
            <ellipse
              cx={zone.cx}
              cy={zone.cy}
              rx={zone.rx + (isActive || isHovered ? 6 : 0)}
              ry={zone.ry + (isActive || isHovered ? 6 : 0)}
              fill={heatColor}
              fillOpacity={isActive ? 0.55 : isHovered ? 0.40 : 0.25}
              stroke={isActive ? heatColor : isHovered ? heatColor : 'transparent'}
              strokeWidth={isActive ? 2.5 : isHovered ? 2 : 0}
              strokeOpacity={0.8}
              className="cursor-pointer transition-all duration-200"
              filter={isActive ? 'url(#glow)' : undefined}
              onClick={() => onZoneClick(zone)}
              onMouseEnter={() => setHovered(zone.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ transition: 'all 0.2s ease' }}
            />
            {/* Zone label dot */}
            {!isActive && (
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r={6}
                fill={heatColor}
                opacity={0.9}
                className="cursor-pointer"
                onClick={() => onZoneClick(zone)}
                onMouseEnter={() => setHovered(zone.id)}
                onMouseLeave={() => setHovered(null)}
              />
            )}
            {isActive && (
              <circle cx={zone.cx} cy={zone.cy} r={9} fill="white" opacity={0.9}
                style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function FacialHeatmap() {
  const [user, setUser] = useState(null);
  const [activeZone, setActiveZone] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [advice, setAdvice] = useState({});
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: analysis } = useQuery({
    queryKey: ['heatmapAnalysis', user?.email],
    queryFn: () =>
      base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1)
        .then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const handleZoneClick = async (zone) => {
    setActiveZone(zone);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);

    if (advice[zone.id]) return; // already fetched

    setLoading(true);
    const skinProfile = analysis
      ? `Skin type: ${analysis.skin_type}, Overall score: ${analysis.overall_score}/100, Acne: ${analysis.acne_level}/10, Dark spots: ${analysis.dark_spots}/10, Wrinkles: ${analysis.wrinkles}/10, Pores: ${analysis.pores}/10, Redness: ${analysis.redness}/10, Oiliness: ${analysis.oiliness}/10, Dryness: ${analysis.dryness}/10, Sensitivity: ${analysis.sensitivity}/10`
      : 'No skin analysis available — give general advice for this zone.';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a clinical dermatologist. Provide hyper-targeted skincare advice for the ${zone.label} zone of the face specifically.

PATIENT SKIN PROFILE: ${skinProfile}
ZONE DESCRIPTION: ${zone.desc}
ZONE PRIMARY CONCERNS: ${zone.concerns.map(c => CONCERN_LABELS[c]).join(', ')}

Provide:
1. issues: 2-3 specific issues commonly seen in this exact facial zone for this skin profile (each 1 short sentence)
2. ingredients: 3-4 hero ingredients specifically for THIS zone — include the percentage/concentration if relevant and exactly WHY it helps this zone
3. products: 3 specific product types (not brand names) that should be applied to this zone — include application method specific to this zone
4. pro_tip: 1 expert dermatologist pro tip specific to this facial zone (2 sentences)
5. avoid: 1-2 ingredients to avoid on this specific zone`,
      response_json_schema: {
        type: 'object',
        properties: {
          issues: { type: 'array', items: { type: 'string' } },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                reason: { type: 'string' },
                concentration: { type: 'string' },
              },
            },
          },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                how_to_apply: { type: 'string' },
              },
            },
          },
          pro_tip: { type: 'string' },
          avoid: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    setAdvice(prev => ({ ...prev, [zone.id]: result }));
    setLoading(false);
  };

  const zoneAdvice = activeZone ? advice[activeZone.id] : null;
  const zoneScores = activeZone && analysis
    ? activeZone.concerns.map(c => ({ label: CONCERN_LABELS[c], score: analysis[c] ?? 0 }))
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-400 bg-clip-text text-transparent">
          Facial Heatmap
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Tap any zone on your face to get targeted dermatologist-grade advice
        </p>
      </div>

      {!user && (
        <GlassCard className="flex items-center gap-4 p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <a href="#" onClick={e => { e.preventDefault(); base44.auth.redirectToLogin(); }} className="text-rose-500 font-semibold underline">Sign in</a> and complete a skin analysis for personalized zone advice.
          </p>
        </GlassCard>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[['#10b981', 'Healthy (0–3)'], ['#f59e0b', 'Moderate (4–6)'], ['#f43f5e', 'High Concern (7–10)'], ['#94a3b8', 'No data']].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5 font-medium text-gray-500 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ─── Face Model ─── */}
        <GlassCard className="relative p-4 lg:sticky lg:top-8">
          <div className="text-center mb-3">
            <p className="text-xs text-gray-400 font-medium">
              {activeZone ? `Viewing: ${activeZone.emoji} ${activeZone.label}` : 'Tap a highlighted zone'}
            </p>
          </div>
          <FaceModel
            zones={ZONES}
            analysis={analysis}
            activeZone={activeZone}
            onZoneClick={handleZoneClick}
            hovered={hovered}
            setHovered={setHovered}
          />
          {/* Zone chips */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-4">
            {ZONES.map(zone => {
              const maxScore = analysis ? Math.max(...zone.concerns.map(c => analysis[c] ?? 0)) : null;
              const color = maxScore !== null ? getSeverityColor(maxScore) : zone.color;
              const isActive = activeZone?.id === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => handleZoneClick(zone)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-white/5 border-white/30'}`}
                  style={isActive ? { background: color, borderColor: color, boxShadow: `0 0 10px 2px ${color}55` } : { borderColor: color + '66' }}
                >
                  {zone.emoji} {zone.label}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* ─── Advice Panel ─── */}
        <div ref={panelRef} className="space-y-4">
          <AnimatePresence mode="wait">
            {!activeZone && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="text-center py-16">
                  <div className="text-6xl mb-4">👆</div>
                  <p className="text-gray-500 font-medium">Select any facial zone to see targeted advice</p>
                  <p className="text-gray-400 text-sm mt-1">Each zone has personalized ingredient & product recommendations</p>
                </GlassCard>
              </motion.div>
            )}

            {activeZone && (
              <motion.div key={activeZone.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">

                {/* Zone header */}
                <GlassCard className="p-4" style={{ borderColor: activeZone.color + '44' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{activeZone.emoji}</span>
                        <h2 className="text-xl font-bold">{activeZone.label}</h2>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activeZone.desc}</p>
                    </div>
                    <button onClick={() => setActiveZone(null)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Concern scores for this zone */}
                  {zoneScores.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {zoneScores.map(({ label, score }) => (
                        <div key={label} className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs"
                          style={{ background: getSeverityColor(score) + '18' }}>
                          <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
                          <span className="font-bold" style={{ color: getSeverityColor(score) }}>
                            {score}/10 · {getSeverityLabel(score)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                {/* Loading */}
                {loading && (
                  <GlassCard className="flex items-center gap-3 p-5">
                    <Loader2 className="w-5 h-5 text-rose-500 animate-spin flex-shrink-0" />
                    <p className="text-sm text-gray-500">Analyzing {activeZone.label} zone...</p>
                  </GlassCard>
                )}

                {/* Advice content */}
                {zoneAdvice && !loading && (
                  <>
                    {/* Issues */}
                    <GlassCard className="p-4">
                      <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-rose-500">
                        <AlertCircle className="w-4 h-4" /> Detected Issues
                      </h3>
                      <ul className="space-y-2">
                        {zoneAdvice.issues?.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </GlassCard>

                    {/* Ingredients */}
                    <GlassCard className="p-4">
                      <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-violet-500">
                        <FlaskConical className="w-4 h-4" /> Hero Ingredients for This Zone
                      </h3>
                      <div className="space-y-3">
                        {zoneAdvice.ingredients?.map((ing, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-black">{i + 1}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-violet-700 dark:text-violet-300">{ing.name}</span>
                                {ing.concentration && (
                                  <Badge className="text-[10px] px-2 py-0 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 border-0">{ing.concentration}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ing.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Products */}
                    <GlassCard className="p-4">
                      <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-amber-500">
                        <ShoppingBag className="w-4 h-4" /> Targeted Products
                      </h3>
                      <div className="space-y-2">
                        {zoneAdvice.products?.map((prod, i) => (
                          <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                            <p className="font-semibold text-sm text-amber-700 dark:text-amber-300">{prod.type}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-start gap-1.5">
                              <Droplets className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" />
                              {prod.how_to_apply}
                            </p>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Pro Tip */}
                    {zoneAdvice.pro_tip && (
                      <GlassCard className="p-4 bg-gradient-to-r from-rose-50/80 to-fuchsia-50/80 dark:from-rose-900/20 dark:to-fuchsia-900/20 border-rose-200/50 dark:border-rose-700/30">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-rose-500">
                          <Sparkles className="w-4 h-4" /> Dermatologist Pro Tip
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{zoneAdvice.pro_tip}</p>
                      </GlassCard>
                    )}

                    {/* Avoid */}
                    {zoneAdvice.avoid?.length > 0 && (
                      <GlassCard className="p-4">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-red-500">
                          <Info className="w-4 h-4" /> Avoid on {activeZone.label}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {zoneAdvice.avoid.map((a, i) => (
                            <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/40">
                              ❌ {a}
                            </span>
                          ))}
                        </div>
                      </GlassCard>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}