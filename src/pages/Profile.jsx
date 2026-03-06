import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User, Mail, LogOut, Star, TrendingUp, Camera, Sparkles,
  Edit2, Save, X, Shield, Moon, Sun, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setDisplayName(u?.full_name || '');
    }).catch(() => {});
  }, []);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['profileAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: analysisCount = 0 } = useQuery({
    queryKey: ['analysisCount', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }).then(r => r.length),
    enabled: !!user?.email,
  });

  const { data: profileData } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }).then(r => r[0] || null),
    enabled: !!user?.email,
    onSuccess: (data) => { if (data?.bio) setBio(data.bio); },
  });

  useEffect(() => {
    if (profileData?.bio) setBio(profileData.bio);
    if (profileData?.display_name) setDisplayName(profileData.display_name);
  }, [profileData]);

  const saveProfile = async () => {
    setSaving(true);
    if (profileData?.id) {
      await base44.entities.UserProfile.update(profileData.id, { display_name: displayName, bio });
    } else {
      await base44.entities.UserProfile.create({ user_email: user.email, display_name: displayName, bio });
    }
    setSaving(false);
    setEditing(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const scoreColor = (score) => {
    if (score >= 75) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const skinTypeBadge = {
    oily: 'bg-blue-100 text-blue-700',
    dry: 'bg-orange-100 text-orange-700',
    combination: 'bg-purple-100 text-purple-700',
    normal: 'bg-emerald-100 text-emerald-700',
    sensitive: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="w-8 h-8 text-pink-500" />
          My Profile
        </h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      {/* Avatar + Name Card */}
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-3xl font-bold text-white">
              {(displayName || user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="font-semibold"
                />
                <Input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short bio (optional)"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveProfile} disabled={saving} className="bg-pink-500 text-white gap-1">
                    <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold truncate">{displayName || user?.full_name || 'Your Name'}</h2>
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setEditing(true)}>
                    <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">{bio}</p>}
                {latestAnalysis?.skin_type && (
                  <Badge className={`mt-2 text-xs ${skinTypeBadge[latestAnalysis.skin_type] || ''}`}>
                    {latestAnalysis.skin_type} skin
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Skin Stats */}
      {latestAnalysis && (
        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Skin Stats
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
              <p className={`text-3xl font-bold ${scoreColor(latestAnalysis.overall_score)}`}>{latestAnalysis.overall_score}</p>
              <p className="text-xs text-gray-500 mt-1">Glow Score</p>
            </div>
            <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
              <p className="text-3xl font-bold text-pink-500">{analysisCount}</p>
              <p className="text-xs text-gray-500 mt-1">Analyses Done</p>
            </div>
            <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
              <p className="text-3xl font-bold text-blue-500">{latestAnalysis.acne_level || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Acne Level</p>
            </div>
            <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
              <p className="text-3xl font-bold text-emerald-500">{latestAnalysis.sensitivity || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Sensitivity</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Quick Links */}
      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" /> Quick Access
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { page: 'SkinAnalysis', label: 'New Analysis', icon: Camera, color: 'text-pink-500' },
            { page: 'Progress', label: 'My Progress', icon: TrendingUp, color: 'text-emerald-500' },
            { page: 'SkinRoutine', label: 'My Routine', icon: Sparkles, color: 'text-amber-500' },
            { page: 'IngredientChecker', label: 'Ingredient Check', icon: Shield, color: 'text-blue-500' },
          ].map(({ page, label, icon: Icon, color }) => (
            <Link key={page} to={createPageUrl(page)}>
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm">{label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </GlassCard>

      {/* Account Info */}
      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" /> Account
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span>Email</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span>Role</span>
            <Badge variant="outline" className="text-xs capitalize">{user?.role || 'user'}</Badge>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="mt-4 w-full gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </GlassCard>
    </div>
  );
}