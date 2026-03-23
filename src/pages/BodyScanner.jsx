import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Scan, Upload, Loader2, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const BODY_AREAS = ['Face', 'Neck', 'Chest', 'Back', 'Arms', 'Hands', 'Scalp', 'Legs'];

export default function BodyScanner() {
  const [selectedArea, setSelectedArea] = useState('Face');
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const analyze = async () => {
    if (!photo) return;
    setLoading(true);
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
    setUploading(false);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this photo of the user's ${selectedArea} skin area. Identify:
1. Visible skin conditions or concerns
2. Skin type characteristics for this area
3. Urgency level (none/monitor/consult dermatologist)
4. Specific care recommendations for this body area
5. Any ingredients to use or avoid for this area
Be professional and note you're an AI, not a doctor.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          area: { type: "string" },
          skin_type: { type: "string" },
          conditions_found: { type: "array", items: { type: "string" } },
          urgency: { type: "string" },
          urgency_note: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
          ingredients_to_use: { type: "array", items: { type: "string" } },
          ingredients_to_avoid: { type: "array", items: { type: "string" } },
          overall_health: { type: "string" },
          disclaimer: { type: "string" }
        }
      }
    });
    setAnalysis({ ...res, photo_url: file_url });
    setLoading(false);
  };

  const urgencyColor = (u) => u === 'none' ? 'text-emerald-500' : u === 'monitor' ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Scan className="w-7 h-7 text-violet-500" /> Body Skin Scanner</h1>
        <p className="text-gray-500 mt-1">AI analysis for any area of your skin — not just your face</p>
      </div>

      <GlassCard>
        <h3 className="font-bold mb-3">Select Body Area</h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {BODY_AREAS.map(area => (
            <button key={area} onClick={() => setSelectedArea(area)}
              className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${selectedArea === area ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-600' : 'border-gray-200 dark:border-gray-700'}`}>
              {area}
            </button>
          ))}
        </div>

        <label className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${photoUrl ? 'border-violet-400' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'}`}>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          {photoUrl ? (
            <img src={photoUrl} alt="Selected" className="max-h-48 mx-auto rounded-xl object-cover" />
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Upload photo of your {selectedArea.toLowerCase()}</p>
              <p className="text-xs text-gray-400 mt-1">Good lighting = better analysis</p>
            </>
          )}
        </label>

        {photo && (
          <Button onClick={analyze} disabled={loading} className="w-full mt-4 bg-gradient-to-r from-violet-500 to-purple-500">
            {loading ? (
              <>{uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</> : <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing {selectedArea}...</>}</>
            ) : (
              <><Scan className="w-4 h-4 mr-2" /> Analyze {selectedArea}</>
            )}
          </Button>
        )}
      </GlassCard>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <GlassCard className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">{analysis.area} Analysis</h3>
              <div className={`flex items-center gap-1 ${urgencyColor(analysis.urgency)}`}>
                {analysis.urgency === 'none' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-sm font-semibold capitalize">{analysis.urgency}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{analysis.overall_health}</p>
            {analysis.urgency_note && <p className={`text-xs font-semibold ${urgencyColor(analysis.urgency)}`}>{analysis.urgency_note}</p>}
          </GlassCard>

          {analysis.conditions_found?.length > 0 && (
            <GlassCard>
              <h4 className="font-bold mb-2">🔍 Conditions Found</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.conditions_found.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <h4 className="font-bold mb-2 text-violet-600">💡 Recommendations</h4>
            {analysis.recommendations?.map((r, i) => <p key={i} className="text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">{i+1}. {r}</p>)}
          </GlassCard>

          <div className="grid grid-cols-2 gap-3">
            <GlassCard>
              <h4 className="text-sm font-bold text-emerald-600 mb-2">✅ Use</h4>
              {analysis.ingredients_to_use?.map((ing, i) => <Badge key={i} className="bg-emerald-500 mr-1 mb-1 text-xs">{ing}</Badge>)}
            </GlassCard>
            <GlassCard>
              <h4 className="text-sm font-bold text-red-600 mb-2">❌ Avoid</h4>
              {analysis.ingredients_to_avoid?.map((ing, i) => <Badge key={i} className="bg-red-500 mr-1 mb-1 text-xs">{ing}</Badge>)}
            </GlassCard>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ {analysis.disclaimer}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}