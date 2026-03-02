import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Sparkles, Loader2, Clock, Check, ChevronDown,
  ChevronUp, Bell, BellOff, RefreshCw, Plus, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

export default function SkinRoutine() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('morning');
  const [generating, setGenerating] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: async () => {
      const analyses = await base44.entities.SkinAnalysis.filter(
        { user_email: user.email },
        '-created_date',
        1
      );
      return analyses[0] || null;
    },
    enabled: !!user?.email,
  });

  const currentRoutine = routines.find(r => r.routine_type === activeTab);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (currentRoutine) {
        return base44.entities.SkinRoutine.update(currentRoutine.id, data);
      }
      return base44.entities.SkinRoutine.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries(['routines']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SkinRoutine.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['routines']),
  });

  const generateRoutine = async () => {
    if (!latestAnalysis) return;
    
    setGenerating(true);

    const concerns = [];
    if (latestAnalysis.acne_level > 4) concerns.push('acne');
    if (latestAnalysis.dark_spots > 4) concerns.push('dark spots');
    if (latestAnalysis.wrinkles > 4) concerns.push('anti-aging');
    if (latestAnalysis.oiliness > 4) concerns.push('oily skin');
    if (latestAnalysis.dryness > 4) concerns.push('dryness');
    if (latestAnalysis.sensitivity > 4) concerns.push('sensitivity');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a personalized ${activeTab} skincare routine for someone with:
- Skin type: ${latestAnalysis.skin_type}
- Main concerns: ${concerns.join(', ') || 'general maintenance'}

Provide a step-by-step routine with 4-6 steps. For each step include:
1. Product type (e.g., Gentle Cleanser, Hydrating Toner)
2. How to apply it properly
3. How long to wait before next step
4. Why this step benefits their specific skin type and concerns

Make it practical and achievable for daily use.`,
      response_json_schema: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                order: { type: "number" },
                product_type: { type: "string" },
                how_to_apply: { type: "string" },
                duration: { type: "string" },
                benefits: { type: "string" }
              }
            }
          }
        }
      }
    });

    await saveMutation.mutateAsync({
      user_email: user.email,
      routine_type: activeTab,
      steps: result.steps,
      skin_concerns: concerns,
      reminder_enabled: false,
      reminder_time: activeTab === 'morning' ? '07:00' : '21:00',
    });

    setGenerating(false);
  };

  const toggleReminder = async () => {
    if (!currentRoutine) return;
    await saveMutation.mutateAsync({
      ...currentRoutine,
      reminder_enabled: !currentRoutine.reminder_enabled,
    });
  };

  const updateReminderTime = async (time) => {
    if (!currentRoutine) return;
    await saveMutation.mutateAsync({
      ...currentRoutine,
      reminder_time: time,
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Personalized Skin Routine</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Sign in to get your customized morning and night skincare routine
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-pink-500 to-amber-500"
          >
            Sign In to Get Started
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Your Skin Routine</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          AI-generated routines tailored to your skin
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === 'morning' ? 'default' : 'outline'}
          onClick={() => setActiveTab('morning')}
          className={activeTab === 'morning' ? 'bg-gradient-to-r from-amber-400 to-orange-400' : ''}
        >
          <Sun className="w-4 h-4 mr-2" />
          Morning Routine
        </Button>
        <Button
          variant={activeTab === 'night' ? 'default' : 'outline'}
          onClick={() => setActiveTab('night')}
          className={activeTab === 'night' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : ''}
        >
          <Moon className="w-4 h-4 mr-2" />
          Night Routine
        </Button>
      </div>

      {/* No Analysis Warning */}
      {!latestAnalysis && (
        <GlassCard className="border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Complete a skin analysis first</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We need to analyze your skin to create a personalized routine
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Routine Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <GlassCard key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </GlassCard>
          ))}
        </div>
      ) : currentRoutine ? (
        <div className="space-y-4">
          {/* Reminder Settings */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentRoutine.reminder_enabled ? (
                  <Bell className="w-5 h-5 text-pink-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium">Daily Reminder</p>
                  <p className="text-sm text-gray-500">
                    Get notified to do your {activeTab} routine
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="time"
                  value={currentRoutine.reminder_time || ''}
                  onChange={(e) => updateReminderTime(e.target.value)}
                  className="w-28"
                />
                <Switch
                  checked={currentRoutine.reminder_enabled}
                  onCheckedChange={toggleReminder}
                />
              </div>
            </div>
          </GlassCard>

          {/* Skin Concerns */}
          {currentRoutine.skin_concerns?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Targeting:</span>
              {currentRoutine.skin_concerns.map((concern, i) => (
                <Badge key={i} variant="secondary" className="capitalize">
                  {concern}
                </Badge>
              ))}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {currentRoutine.steps?.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  className="cursor-pointer"
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activeTab === 'morning'
                        ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    } text-white font-bold`}>
                      {step.order || index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{step.product_type}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {step.duration}
                      </div>
                    </div>
                    {expandedStep === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedStep === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">How to Apply</p>
                            <p className="text-gray-700 dark:text-gray-300">{step.how_to_apply}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Why It Helps</p>
                            <p className="text-gray-700 dark:text-gray-300">{step.benefits}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={generateRoutine}
              disabled={generating || !latestAnalysis}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              Regenerate Routine
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(currentRoutine.id)}
              className="px-4"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
            activeTab === 'morning'
              ? 'bg-gradient-to-br from-amber-400 to-orange-400'
              : 'bg-gradient-to-br from-indigo-500 to-purple-500'
          }`}>
            {activeTab === 'morning' ? (
              <Sun className="w-8 h-8 text-white" />
            ) : (
              <Moon className="w-8 h-8 text-white" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No {activeTab} routine yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Generate a personalized routine based on your skin analysis
          </p>
          <Button
            onClick={generateRoutine}
            disabled={generating || !latestAnalysis}
            className="bg-gradient-to-r from-pink-500 to-amber-500"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Your Routine...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Routine
              </>
            )}
          </Button>
        </GlassCard>
      )}
    </div>
  );
}