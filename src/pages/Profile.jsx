import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  User, Camera, Sparkles, TrendingUp, Calendar,
  Award, Target, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';
import { format } from 'date-fns';

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: progressPhotos = [] } = useQuery({
    queryKey: ['progressPhotos', user?.email],
    queryFn: () => base44.entities.ProgressPhoto.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: savedProducts = [] } = useQuery({
    queryKey: ['savedProducts', user?.email],
    queryFn: () => base44.entities.SavedProduct.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: communityPosts = [] } = useQuery({
    queryKey: ['userPosts', user?.email],
    queryFn: () => base44.entities.CommunityPost.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const latestAnalysis = analyses[0];
  const firstAnalysis = analyses[analyses.length - 1];

  const getImprovement = () => {
    if (!firstAnalysis || !latestAnalysis || analyses.length < 2) return null;
    const diff = latestAnalysis.overall_score - firstAnalysis.overall_score;
    return {
      value: Math.abs(diff),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
    };
  };

  const improvement = getImprovement();

  const getBadges = () => {
    const badges = [];
    if (analyses.length >= 1) badges.push({ name: 'First Analysis', icon: '🔬' });
    if (analyses.length >= 5) badges.push({ name: 'Regular Checker', icon: '📊' });
    if (progressPhotos.length >= 4) badges.push({ name: 'Progress Tracker', icon: '📸' });
    if (improvement?.direction === 'up' && improvement.value >= 10) badges.push({ name: 'Skin Hero', icon: '🦸' });
    if (communityPosts.length >= 1) badges.push({ name: 'Community Member', icon: '👥' });
    if (savedProducts.length >= 5) badges.push({ name: 'Product Explorer', icon: '🧴' });
    return badges;
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-200 to-amber-200 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 text-3xl">
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-amber-400 text-white">
              {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold">{user.full_name || 'Skin Enthusiast'}</h1>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-400 mt-1">
              Member since {format(new Date(user.created_date), 'MMMM yyyy')}
            </p>
            
            {/* Badges */}
            {getBadges().length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {getBadges().map((badge, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    <span>{badge.icon}</span>
                    {badge.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>


        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard delay={0.1} className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-3">
            <Camera className="w-6 h-6 text-pink-500" />
          </div>
          <p className="text-2xl font-bold">{analyses.length}</p>
          <p className="text-sm text-gray-500">Analyses</p>
        </GlassCard>

        <GlassCard delay={0.2} className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold">{progressPhotos.length}</p>
          <p className="text-sm text-gray-500">Progress Photos</p>
        </GlassCard>

        <GlassCard delay={0.3} className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{savedProducts.length}</p>
          <p className="text-sm text-gray-500">Saved Products</p>
        </GlassCard>

        <GlassCard delay={0.4} className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-2xl font-bold">{getBadges().length}</p>
          <p className="text-sm text-gray-500">Badges</p>
        </GlassCard>
      </div>

      {/* Skin Overview */}
      {latestAnalysis && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-500" />
            Skin Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <CircularProgress
                value={latestAnalysis.overall_score}
                size={120}
                strokeWidth={10}
                label="Current Score"
                color="pink"
              />
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Skin Type</p>
                <p className="font-semibold capitalize">{latestAnalysis.skin_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Skin Tone</p>
                <p className="font-semibold">{latestAnalysis.skin_tone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Analyzed</p>
                <p className="font-semibold">
                  {format(new Date(latestAnalysis.created_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {improvement && (
                <div className={`p-4 rounded-xl ${
                  improvement.direction === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                  improvement.direction === 'down' ? 'bg-red-50 dark:bg-red-900/20' :
                  'bg-gray-50 dark:bg-gray-800'
                }`}>
                  <p className="text-sm text-gray-500">Total Improvement</p>
                  <p className={`text-2xl font-bold ${
                    improvement.direction === 'up' ? 'text-emerald-500' :
                    improvement.direction === 'down' ? 'text-red-500' :
                    'text-gray-500'
                  }`}>
                    {improvement.direction === 'up' ? '+' : improvement.direction === 'down' ? '-' : ''}
                    {improvement.value} points
                  </p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Quick Links */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <Link to={createPageUrl('SkinAnalysis')}>
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-pink-500" />
                <span>New Skin Analysis</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
          <Link to={createPageUrl('Progress')}>
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span>View Progress</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
          <Link to={createPageUrl('SkinRoutine')}>
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>My Routines</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
          <Link to={createPageUrl('Products')}>
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-blue-500" />
                <span>Saved Products</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        </div>
      </GlassCard>

      {/* Recent Activity */}
      {analyses.length > 0 && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-500" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {analyses.slice(0, 5).map((analysis, i) => (
              <div
                key={analysis.id}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  {analysis.photo_url ? (
                    <img
                      src={analysis.photo_url}
                      alt="Analysis"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Skin Analysis</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(analysis.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge className={`${
                  analysis.overall_score >= 70 ? 'bg-emerald-500' :
                  analysis.overall_score >= 50 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}>
                  Score: {analysis.overall_score}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}