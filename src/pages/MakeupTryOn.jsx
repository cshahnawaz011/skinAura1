import React, { useState, useRef, useEffect } from 'react';
import { checkUploadCooldown, recordUploadUsage, getUploadCooldownSeconds } from '@/components/utils/aiRateLimit';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Palette, Heart, Download, Share2,
  Loader2, X, Check, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import GlassCard from '@/components/ui/GlassCard';

const foundationShades = [
  { name: 'Porcelain', color: '#F5E1D0' },
  { name: 'Ivory', color: '#F2D4BC' },
  { name: 'Sand', color: '#E8C4A8' },
  { name: 'Beige', color: '#D4A574' },
  { name: 'Caramel', color: '#C68E5E' },
  { name: 'Mocha', color: '#8B6914' },
  { name: 'Espresso', color: '#5D4037' },
  { name: 'Ebony', color: '#3E2723' },
];

const lipstickColors = [
  { name: 'Nude Pink', color: '#D4A5A5' },
  { name: 'Rose', color: '#C97070' },
  { name: 'Berry', color: '#8B3A62' },
  { name: 'Red', color: '#B22222' },
  { name: 'Coral', color: '#E07050' },
  { name: 'Mauve', color: '#8B687F' },
  { name: 'Plum', color: '#6B3E51' },
  { name: 'Wine', color: '#722F37' },
];

const eyeshadowLooks = [
  { name: 'Natural', colors: ['#E8D4C0', '#C9A888'] },
  { name: 'Smoky', colors: ['#4A4A4A', '#1A1A1A'] },
  { name: 'Rose Gold', colors: ['#B76E79', '#E8C4A8'] },
  { name: 'Bronze', colors: ['#CD7F32', '#8B4513'] },
  { name: 'Purple Haze', colors: ['#9370DB', '#4B0082'] },
  { name: 'Golden', colors: ['#FFD700', '#DAA520'] },
];

const blushStyles = [
  { name: 'Soft Pink', color: '#FFB6C1' },
  { name: 'Peach', color: '#FFCBA4' },
  { name: 'Rose', color: '#E8ADAA' },
  { name: 'Berry', color: '#9B6B8D' },
];

export default function MakeupTryOn() {
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('foundation');
  const [selectedMakeup, setSelectedMakeup] = useState({
    foundation: null,
    lipstick: null,
    eyeshadow: null,
    blush: null,
  });
  const [resultImage, setResultImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [lookName, setLookName] = useState('');
  const [uploadCooldown, setUploadCooldown] = useState(getUploadCooldownSeconds('makeup_photo'));
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (uploadCooldown <= 0) return;
    const t = setInterval(() => {
      setUploadCooldown(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [uploadCooldown]);

  const { data: savedLooks = [] } = useQuery({
    queryKey: ['savedLooks', user?.email],
    queryFn: () => base44.entities.SavedMakeupLook.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedMakeupLook.create(data),
    onSuccess: () => queryClient.invalidateQueries(['savedLooks']),
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const generateMakeupLook = async () => {
    if (!selectedImage) return;
    
    setGenerating(true);

    // Upload original image
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: selectedImage
    });

    // Build makeup description
    const makeupDescription = [];
    if (selectedMakeup.foundation) makeupDescription.push(`foundation shade: ${selectedMakeup.foundation}`);
    if (selectedMakeup.lipstick) makeupDescription.push(`lipstick color: ${selectedMakeup.lipstick}`);
    if (selectedMakeup.eyeshadow) makeupDescription.push(`eyeshadow look: ${selectedMakeup.eyeshadow}`);
    if (selectedMakeup.blush) makeupDescription.push(`blush: ${selectedMakeup.blush}`);

    // Generate makeup look with AI
    const result = await base44.integrations.Core.GenerateImage({
      prompt: `Apply subtle, natural-looking makeup to this portrait photo. Keep the person's features and identity exactly the same. Apply: ${makeupDescription.join(', ')}. The makeup should look professional and realistic, as if applied by a makeup artist. Maintain natural skin texture and lighting.`,
      existing_image_urls: [file_url]
    });

    setResultImage(result.url);
    setGenerating(false);
  };

  const saveLook = async () => {
    if (!resultImage || !lookName || !user) return;

    await saveMutation.mutateAsync({
      user_email: user.email,
      look_name: lookName,
      original_photo: previewUrl,
      result_photo: resultImage,
      foundation_shade: selectedMakeup.foundation,
      lipstick_color: selectedMakeup.lipstick,
      eyeshadow_look: selectedMakeup.eyeshadow,
      blush_style: selectedMakeup.blush,
    });

    setLookName('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Virtual Makeup Try-On</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Try different makeup looks with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Upload & Preview */}
        <div className="space-y-4">
          <GlassCard>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-pink-400 transition-colors"
              >
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium">Upload Your Selfie</p>
                <p className="text-sm text-gray-500 mt-1">
                  Clear, front-facing photo works best
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2 text-center">Original</p>
                    <img
                      src={previewUrl}
                      alt="Original"
                      className="w-full rounded-xl"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2 text-center">With Makeup</p>
                    {resultImage ? (
                      <img
                        src={resultImage}
                        alt="With Makeup"
                        className="w-full rounded-xl"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                        <p className="text-gray-400 text-sm text-center px-4">
                          Select makeup options and generate
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedImage(null);
                    setResultImage(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </GlassCard>

          {previewUrl && (
            <Button
              onClick={generateMakeupLook}
              disabled={generating || !Object.values(selectedMakeup).some(v => v)}
              className="w-full bg-gradient-to-r from-pink-500 to-amber-500 py-6"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Your Look...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Makeup Look
                </>
              )}
            </Button>
          )}

          {/* Save Look */}
          {resultImage && user && (
            <GlassCard>
              <h3 className="font-semibold mb-3">Save This Look</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Name your look..."
                  value={lookName}
                  onChange={(e) => setLookName(e.target.value)}
                />
                <Button
                  onClick={saveLook}
                  disabled={!lookName || saveMutation.isPending}
                  className="bg-pink-500"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Makeup Options */}
        <div className="space-y-4">
          <GlassCard>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="foundation">Foundation</TabsTrigger>
                <TabsTrigger value="lips">Lips</TabsTrigger>
                <TabsTrigger value="eyes">Eyes</TabsTrigger>
                <TabsTrigger value="blush">Blush</TabsTrigger>
              </TabsList>

              {/* Foundation */}
              {activeTab === 'foundation' && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Choose your foundation shade</p>
                  <div className="grid grid-cols-4 gap-3">
                    {foundationShades.map((shade) => (
                      <button
                        key={shade.name}
                        onClick={() => setSelectedMakeup({ ...selectedMakeup, foundation: shade.name })}
                        className={`p-2 rounded-xl transition-all ${
                          selectedMakeup.foundation === shade.name
                            ? 'ring-2 ring-pink-500 ring-offset-2'
                            : ''
                        }`}
                      >
                        <div
                          className="w-full aspect-square rounded-lg mb-1"
                          style={{ backgroundColor: shade.color }}
                        />
                        <p className="text-xs text-center">{shade.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lipstick */}
              {activeTab === 'lips' && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Choose your lipstick color</p>
                  <div className="grid grid-cols-4 gap-3">
                    {lipstickColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedMakeup({ ...selectedMakeup, lipstick: color.name })}
                        className={`p-2 rounded-xl transition-all ${
                          selectedMakeup.lipstick === color.name
                            ? 'ring-2 ring-pink-500 ring-offset-2'
                            : ''
                        }`}
                      >
                        <div
                          className="w-full aspect-square rounded-lg mb-1"
                          style={{ backgroundColor: color.color }}
                        />
                        <p className="text-xs text-center">{color.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Eyeshadow */}
              {activeTab === 'eyes' && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Choose your eyeshadow look</p>
                  <div className="grid grid-cols-3 gap-3">
                    {eyeshadowLooks.map((look) => (
                      <button
                        key={look.name}
                        onClick={() => setSelectedMakeup({ ...selectedMakeup, eyeshadow: look.name })}
                        className={`p-3 rounded-xl transition-all ${
                          selectedMakeup.eyeshadow === look.name
                            ? 'ring-2 ring-pink-500 ring-offset-2'
                            : ''
                        }`}
                      >
                        <div className="flex gap-1 mb-2">
                          {look.colors.map((c, i) => (
                            <div
                              key={i}
                              className="flex-1 h-8 rounded"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-center">{look.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Blush */}
              {activeTab === 'blush' && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Choose your blush style</p>
                  <div className="grid grid-cols-4 gap-3">
                    {blushStyles.map((style) => (
                      <button
                        key={style.name}
                        onClick={() => setSelectedMakeup({ ...selectedMakeup, blush: style.name })}
                        className={`p-2 rounded-xl transition-all ${
                          selectedMakeup.blush === style.name
                            ? 'ring-2 ring-pink-500 ring-offset-2'
                            : ''
                        }`}
                      >
                        <div
                          className="w-full aspect-square rounded-full mb-1"
                          style={{ backgroundColor: style.color }}
                        />
                        <p className="text-xs text-center">{style.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Tabs>
          </GlassCard>

          {/* Selected Options */}
          {Object.values(selectedMakeup).some(v => v) && (
            <GlassCard>
              <h3 className="font-semibold mb-3">Selected Look</h3>
              <div className="flex flex-wrap gap-2">
                {selectedMakeup.foundation && (
                  <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-full text-sm">
                    Foundation: {selectedMakeup.foundation}
                  </span>
                )}
                {selectedMakeup.lipstick && (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-sm">
                    Lips: {selectedMakeup.lipstick}
                  </span>
                )}
                {selectedMakeup.eyeshadow && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full text-sm">
                    Eyes: {selectedMakeup.eyeshadow}
                  </span>
                )}
                {selectedMakeup.blush && (
                  <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full text-sm">
                    Blush: {selectedMakeup.blush}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMakeup({ foundation: null, lipstick: null, eyeshadow: null, blush: null })}
                className="mt-3"
              >
                Clear All
              </Button>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Saved Looks */}
      {savedLooks.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Saved Looks</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {savedLooks.map((look) => (
              <GlassCard key={look.id} className="p-3">
                <img
                  src={look.result_photo}
                  alt={look.look_name}
                  className="w-full aspect-square object-cover rounded-lg mb-2"
                />
                <p className="font-medium text-sm">{look.look_name}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}