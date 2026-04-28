import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, RefreshCw, ChevronDown, ChevronUp, Package } from 'lucide-react';

const CATEGORY_MAP = {
  cleanser: 'cleanser', wash: 'cleanser', foam: 'cleanser',
  toner: 'toner', mist: 'toner',
  serum: 'serum', essence: 'serum',
  moisturizer: 'moisturizer', cream: 'moisturizer', gel: 'moisturizer',
  sunscreen: 'sunscreen', spf: 'sunscreen',
  eye: 'eye_cream',
  mask: 'face_mask',
  retinol: 'retinol',
  treatment: 'treatment', spot: 'treatment',
  exfoliant: 'exfoliant', aha: 'exfoliant', bha: 'exfoliant', acid: 'exfoliant',
};

function guessCategory(name = '') {
  const n = name.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (n.includes(key)) return val;
  }
  return 'other';
}

export default function StepProductSelector({ step, userEmail, onSaved }) {
  const [open, setOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [concentration, setConcentration] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async () => {
    if (!step?.name) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest 3 popular, affordable real products for skincare step: "${step.name}" (${step.type || ''}). 
Return JSON with products array: [{name, brand, concentration (e.g. "Niacinamide 10%"), key_ingredients[]}]`,
      response_json_schema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                brand: { type: 'string' },
                concentration: { type: 'string' },
                key_ingredients: { type: 'array', items: { type: 'string' } },
              }
            }
          }
        }
      }
    });
    setSuggestions(res?.products || []);
    setAiLoading(false);
  };

  const applySuggestion = (p) => {
    setProductName(p.name);
    setBrand(p.brand);
    setConcentration(p.concentration || '');
    setIngredients((p.key_ingredients || []).join(', '));
  };

  const handleSave = async () => {
    if (!productName.trim() || !userEmail) return;
    setSaving(true);
    const parsed = ingredients.split(',').map(s => s.trim()).filter(Boolean);
    await base44.entities.SavedProduct.create({
      user_email: userEmail,
      product_name: productName.trim(),
      brand: brand.trim(),
      category: guessCategory(step?.name || productName),
      key_ingredients: parsed,
      routine_step: step?.name || '',
      skin_analysis_notes: concentration.trim(),
      benefits: `${step?.name || ''} — ${concentration || 'unspecified concentration'}`,
    });
    setSaving(false);
    setSaved(true);
    setProductName('');
    setBrand('');
    setConcentration('');
    setIngredients('');
    setSuggestions([]);
    if (onSaved) onSaved();
    setTimeout(() => { setSaved(false); setOpen(false); }, 1500);
  };

  return (
    <div className="mt-2">
      <button onClick={() => { setOpen(o => !o); if (!open && suggestions.length === 0) fetchSuggestions(); }}
        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all"
        style={{ background: open ? 'rgba(167,139,250,0.12)' : 'rgba(0,0,0,0.04)', color: open ? '#7c3aed' : '#9ca3af', border: `1px solid ${open ? 'rgba(167,139,250,0.3)' : 'transparent'}` }}>
        <Package className="w-3 h-3" />
        Select Product for this Step
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2 space-y-3 rounded-2xl p-3"
            style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}>

            {/* AI Suggestions */}
            <div>
              <p className="text-[10px] font-black text-violet-600 mb-1.5">
                {aiLoading ? '⏳ Finding suggestions…' : '💡 AI Suggestions'}
              </p>
              {aiLoading && <RefreshCw className="w-4 h-4 animate-spin text-violet-400 mx-auto" />}
              {!aiLoading && suggestions.length > 0 && (
                <div className="space-y-1.5">
                  {suggestions.map((p, i) => (
                    <button key={i} onClick={() => applySuggestion(p)}
                      className="w-full text-left flex items-start gap-2 p-2 rounded-xl transition-all hover:bg-violet-50"
                      style={{ border: '1px solid rgba(167,139,250,0.15)' }}>
                      <span className="text-base flex-shrink-0">🧴</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-800">{p.name}</p>
                        <p className="text-[10px] text-gray-500">{p.brand}</p>
                        {p.concentration && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 inline-block mt-0.5">{p.concentration}</span>
                        )}
                      </div>
                      <span className="text-[9px] text-violet-500 font-bold flex-shrink-0">Tap to use</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500">Or enter manually:</p>
              <input value={productName} onChange={e => setProductName(e.target.value)}
                placeholder="Product name *"
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                style={{ borderColor: 'rgba(167,139,250,0.3)', background: 'white' }} />
              <input value={brand} onChange={e => setBrand(e.target.value)}
                placeholder="Brand (optional)"
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                style={{ borderColor: 'rgba(167,139,250,0.3)', background: 'white' }} />
              <input value={concentration} onChange={e => setConcentration(e.target.value)}
                placeholder="Concentration (e.g. Niacinamide 10%, Retinol 0.3%)"
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                style={{ borderColor: 'rgba(167,139,250,0.3)', background: 'white' }} />
              <input value={ingredients} onChange={e => setIngredients(e.target.value)}
                placeholder="Key ingredients (comma-separated)"
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                style={{ borderColor: 'rgba(167,139,250,0.3)', background: 'white' }} />
            </div>

            <button onClick={handleSave} disabled={!productName.trim() || saving || saved}
              className="w-full py-2 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all"
              style={{ background: saved ? '#34d399' : 'linear-gradient(135deg,#a78bfa,#f472b6)', opacity: (!productName.trim() && !saving) ? 0.5 : 1 }}>
              {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : saved ? <><Check className="w-3.5 h-3.5" /> Saved to Products!</>
                : <><Plus className="w-3.5 h-3.5" /> Save to My Products</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}