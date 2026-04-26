import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Zap, Check, Lock, Star, Flame, Calendar,
  ChevronRight, Sparkles, Target, Award, Heart, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const CHALLENGES = [
  {
    id: 'week1', week: 1, title: 'Foundation Week', theme: 'Build the Basics',
    color: 'from-emerald-400 to-teal-400', emoji: '🌱',
    days: [
      { day: 1, task: 'Drink 8 glasses of water', points: 10, icon: '💧' },
      { day: 2, task: 'Complete morning skincare routine', points: 10, icon: '☀️' },
      { day: 3, task: 'Apply SPF before going outside', points: 12, icon: '🧴' },
      { day: 4, task: 'Get 7+ hours of sleep', points: 15, icon: '😴' },
      { day: 5, task: 'Eat 3 skin-healthy foods', points: 10, icon: '🥗' },
      { day: 6, task: 'Complete night skincare routine', points: 10, icon: '🌙' },
      { day: 7, task: 'Take a progress photo', points: 20, icon: '📸' },
    ]
  },
  {
    id: 'week2', week: 2, title: 'Glow Activation', theme: 'Boost Radiance',
    color: 'from-amber-400 to-orange-400', emoji: '✨',
    days: [
      { day: 8, task: 'Exfoliate gently (AHA or BHA)', points: 15, icon: '✨' },
      { day: 9, task: 'Add Vitamin C serum to morning routine', points: 12, icon: '🍋' },
      { day: 10, task: 'No sugar for the entire day', points: 20, icon: '🚫' },
      { day: 11, task: '10-minute facial massage', points: 15, icon: '💆' },
      { day: 12, task: 'Drink green tea instead of coffee', points: 10, icon: '🍵' },
      { day: 13, task: 'Face mask session', points: 20, icon: '🧖' },
      { day: 14, task: 'Compare progress photos', points: 25, icon: '📊' },
    ]
  },
  {
    id: 'week3', week: 3, title: 'Transformation', theme: 'Level Up',
    color: 'from-violet-500 to-purple-500', emoji: '🌟',
    days: [
      { day: 15, task: 'Start retinol or peptide serum at night', points: 20, icon: '🔬' },
      { day: 16, task: 'Meditate 10 minutes for stress reduction', points: 15, icon: '🧘' },
      { day: 17, task: 'No dairy for 24 hours', points: 15, icon: '🥛' },
      { day: 18, task: 'Jade roller or gua sha session', points: 15, icon: '💎' },
      { day: 19, task: 'Extra 500ml water above your goal', points: 10, icon: '💧' },
      { day: 20, task: 'Learn one new skincare ingredient', points: 12, icon: '📚' },
      { day: 21, task: 'Full 21-day review + photos', points: 50, icon: '🏆' },
    ]
  }
];

const BADGES = [
  { id: 'hydration-hero', name: 'Hydration Hero', emoji: '💧', condition: 'Complete 7 water tasks', points: 50 },
  { id: 'spf-warrior', name: 'SPF Warrior', emoji: '☀️', condition: 'Apply SPF 7 days straight', points: 60 },
  { id: 'glow-getter', name: 'Glow Getter', emoji: '✨', condition: 'Reach 200 points', points: 0 },
  { id: 'sleep-queen', name: 'Sleep Queen', emoji: '😴', condition: '7 nights of 7+ hours sleep', points: 70 },
  { id: 'consistency-king', name: 'Consistency King', emoji: '👑', condition: 'Complete 14 days in a row', points: 100 },
  { id: 'transformation', name: 'Transformation', emoji: '🌟', condition: 'Complete all 21 days', points: 200 },
];

export default function GlowChallenge() {
  const [user, setUser] = useState(null);
  const [completedDays, setCompletedDays] = useState(new Set());
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState(new Set());
  const [currentDay, setCurrentDay] = useState(1);
  const [challengeStart, setChallengeStart] = useState(null);
  const [activeTab, setActiveTab] = useState('challenge');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const saved = localStorage.getItem('glow-challenge');
    if (saved) {
      const data = JSON.parse(saved);
      setCompletedDays(new Set(data.completedDays || []));
      setTotalPoints(data.totalPoints || 0);
      setEarnedBadges(new Set(data.earnedBadges || []));
      setChallengeStart(data.challengeStart);
      if (data.challengeStart) {
        const dayNum = Math.floor((Date.now() - new Date(data.challengeStart).getTime()) / 86400000) + 1;
        setCurrentDay(Math.min(21, Math.max(1, dayNum)));
      }
    }
  }, []);

  const { data: communityPosts = [] } = useQuery({
    queryKey: ['glowChallengePosts'],
    queryFn: () => base44.entities.CommunityPost.list('-likes_count', 20),
  });

  const save = (state) => localStorage.setItem('glow-challenge', JSON.stringify(state));

  const startChallenge = () => {
    const start = new Date().toISOString();
    setChallengeStart(start);
    setCurrentDay(1);
    setCompletedDays(new Set());
    setTotalPoints(0);
    setEarnedBadges(new Set());
    save({ completedDays: [], totalPoints: 0, earnedBadges: [], challengeStart: start });
  };

  const completeTask = (dayNum, points) => {
    if (completedDays.has(dayNum)) return;
    const newCompleted = new Set([...completedDays, dayNum]);
    const newPoints = totalPoints + points;
    const newBadges = new Set(earnedBadges);
    if (newPoints >= 200) newBadges.add('glow-getter');
    if (newCompleted.size >= 21) newBadges.add('transformation');
    if (newCompleted.size >= 14) newBadges.add('consistency-king');
    setCompletedDays(newCompleted);
    setTotalPoints(newPoints);
    setEarnedBadges(newBadges);
    save({ completedDays: [...newCompleted], totalPoints: newPoints, earnedBadges: [...newBadges], challengeStart });
  };

  const shareProgress = async () => {
    if (!user) return base44.auth.redirectToLogin();
    await base44.entities.CommunityPost.create({
      user_email: user.email,
      user_name: user.full_name || user.email.split('@')[0],
      caption: `🏆 Day ${completedDays.size} of 21-Day Glow Challenge! Earned ${totalPoints} points. Consistency is glowing! ✨ #GlowChallenge`,
      overall_score: Math.round((totalPoints / 524) * 100),
      likes_count: 0,
      liked_by: [],
    });
    queryClient.invalidateQueries(['glowChallengePosts']);
    setActiveTab('leaderboard');
  };

  const likePost = async (post) => {
    if (!user) return;
    if (post.liked_by?.includes(user.email)) return;
    await base44.entities.CommunityPost.update(post.id, {
      likes_count: (post.likes_count || 0) + 1,
      liked_by: [...(post.liked_by || []), user.email],
    });
    queryClient.invalidateQueries(['glowChallengePosts']);
  };

  const overallProgress = Math.round((completedDays.size / 21) * 100);
  const allTasks = CHALLENGES.flatMap(c => c.days);
  const maxPoints = allTasks.reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-10 h-10 rounded-2xl object-cover shadow-sm" alt="SkinAura" />
          21-Day Glow Challenge
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Transform your skin in 21 days — and compete with the community</p>
      </div>

      {/* Tab Toggle */}
      {challengeStart && (
        <div className="flex gap-2">
          {[
            { key: 'challenge', label: '📊 My Challenge' },
            { key: 'leaderboard', label: '🏆 Community' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === tab.key ? { background: '#3d2a2a', color: '#fff' } : { background: '#f5f0eb', color: '#9a7e78', border: '1px solid #ede8e3' }}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {challengeStart ? (
        <GlassCard className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="grid grid-cols-4 gap-4 text-center mb-4">
            <div><p className="text-3xl font-black text-amber-500">{completedDays.size}</p><p className="text-xs text-gray-500">Tasks Done</p></div>
            <div><p className="text-3xl font-black text-pink-500">{totalPoints}</p><p className="text-xs text-gray-500">Points</p></div>
            <div><p className="text-3xl font-black text-violet-500">{earnedBadges.size}</p><p className="text-xs text-gray-500">Badges</p></div>
            <div><p className="text-3xl font-black text-emerald-500">{overallProgress}%</p><p className="text-xs text-gray-500">Complete</p></div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <motion.div className="bg-gradient-to-r from-amber-400 to-pink-500 h-3 rounded-full"
              animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.8 }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">Day {currentDay} of 21</p>
            <p className="text-xs text-amber-500 font-medium">{maxPoints - totalPoints} points remaining</p>
          </div>
          {totalPoints > 0 && (
            <button onClick={shareProgress}
              className="mt-3 w-full py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
              <Share2 className="w-4 h-4" /> Share My Progress to Community
            </button>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="text-center py-10">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ready to Transform Your Skin?</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">21 days of science-backed daily tasks to achieve your best skin ever</p>
          <Button onClick={startChallenge} className="ios-button-3d text-white px-8 py-6 text-lg" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            <Flame className="w-5 h-5 mr-2" /> Start Challenge
          </Button>
        </GlassCard>
      )}

      {/* Community Leaderboard */}
      {activeTab === 'leaderboard' && (
        <GlassCard>
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Community Glow Board
          </h3>
          {communityPosts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">No community posts yet.</p>
              <p className="text-xs text-gray-300 mt-1">Complete some tasks and share your progress!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {communityPosts.slice(0, 10).map((post, i) => (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: i < 3 ? '#fff8f0' : '#faf6f2', border: '1px solid #ede8e3' }}>
                  <span className="text-lg font-black w-6 text-center"
                    style={{ color: i === 0 ? '#d4a020' : i === 1 ? '#909090' : i === 2 ? '#c06830' : '#ccc' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#3d2a2a' }}>{post.user_name}</p>
                    <p className="text-xs line-clamp-1" style={{ color: '#9a7e78' }}>{post.caption}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: '#c07080' }}>{post.overall_score}pts</span>
                    <button onClick={() => likePost(post)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
                      style={{ background: post.liked_by?.includes(user?.email) ? '#fce8ec' : '#f5f0eb', color: '#c07080' }}>
                      <Heart className="w-3 h-3" /> {post.likes_count || 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'challenge' && (
        <>
          {/* Badges */}
          {challengeStart && (
            <GlassCard>
              <h3 className="font-bold mb-3 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" />Achievement Badges</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {BADGES.map((badge) => {
                  const earned = earnedBadges.has(badge.id);
                  return (
                    <div key={badge.id} className={`flex flex-col items-center p-3 rounded-xl transition-all ${earned ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30' : 'opacity-40 grayscale'}`}>
                      <span className="text-3xl mb-1">{badge.emoji}</span>
                      <p className="text-xs font-bold text-center">{badge.name}</p>
                      {earned && <Badge className="mt-1 bg-amber-500 text-xs">Earned!</Badge>}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Challenge Weeks */}
          {CHALLENGES.map((week) => {
            const weekComplete = week.days.every(d => completedDays.has(d.day));
            const isUnlocked = !challengeStart ? false : week.week === 1 || completedDays.size >= (week.week - 1) * 7;
            return (
              <GlassCard key={week.id} animate={false}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${week.color} flex items-center justify-center text-2xl`}>
                    {week.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">Week {week.week}: {week.title}</h3>
                      {weekComplete && <Badge className="bg-emerald-500">Complete! ✓</Badge>}
                      {!isUnlocked && <Badge variant="outline" className="text-gray-400"><Lock className="w-3 h-3 mr-1" />Locked</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{week.theme}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {week.days.map((task) => {
                    const done = completedDays.has(task.day);
                    const isCurrentTask = !done && isUnlocked && task.day <= currentDay + 1;
                    return (
                      <div key={task.day}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${done ? 'bg-emerald-50 dark:bg-emerald-900/20' : isCurrentTask ? 'bg-white/50 dark:bg-white/5' : 'opacity-50'}`}>
                        <span className="text-xl">{task.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">Day {task.day}</span>
                            <p className={`text-sm ${done ? 'line-through text-gray-400' : 'font-medium'}`}>{task.task}</p>
                          </div>
                        </div>
                        <span className="text-xs text-amber-500 font-bold">+{task.points}pts</span>
                        {isUnlocked && !done && (
                          <Button size="sm" onClick={() => completeTask(task.day, task.points)}
                            className="h-7 px-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-xs">
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        {done && <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </>
      )}
    </div>
  );
}