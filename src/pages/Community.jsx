import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Plus, X, Loader2,
  Trophy, TrendingUp, Users, Sparkles, Send, Star, Droplets, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';

export default function Community() {
  const [user, setUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50),
  });

  // Fetch latest skin analysis for the current user
  const { data: myAnalysis } = useQuery({
    queryKey: ['mySkinAnalysis', user?.email],
    queryFn: async () => {
      const list = await base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1);
      return list[0] || null;
    },
    enabled: !!user?.email,
  });

  const openShareModal = () => {
    // Auto-fill caption with skin insights if available
    if (myAnalysis) {
      const concerns = [
        myAnalysis.acne_level > 5 && 'acne',
        myAnalysis.dark_spots > 5 && 'dark spots',
        myAnalysis.redness > 5 && 'redness',
        myAnalysis.oiliness > 5 && 'oiliness',
        myAnalysis.dryness > 5 && 'dryness',
      ].filter(Boolean);
      const concernText = concerns.length > 0 ? ` Working on: ${concerns.join(', ')}.` : '';
      setCaption(
        `My current skin score is ${myAnalysis.overall_score}/100 (${myAnalysis.skin_type} skin).${concernText} Sharing my skin health journey! 🌟`
      );
    } else {
      setCaption('');
    }
    setShowCreatePost(true);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.CommunityPost.create({
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        caption,
        overall_score: myAnalysis?.overall_score || null,
        skin_type: myAnalysis?.skin_type || null,
        acne_level: myAnalysis?.acne_level || null,
        dark_spots: myAnalysis?.dark_spots || null,
        redness: myAnalysis?.redness || null,
        likes_count: 0,
        liked_by: [],
        comments: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['communityPosts']);
      setShowCreatePost(false);
      setCaption('');
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const likedBy = post.liked_by || [];
      const isLiked = likedBy.includes(user.email);
      return base44.entities.CommunityPost.update(post.id, {
        liked_by: isLiked ? likedBy.filter(e => e !== user.email) : [...likedBy, user.email],
        likes_count: isLiked ? (post.likes_count || 1) - 1 : (post.likes_count || 0) + 1,
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['communityPosts']),
  });

  const commentMutation = useMutation({
    mutationFn: async ({ post, comment }) => {
      const comments = post.comments || [];
      return base44.entities.CommunityPost.update(post.id, {
        comments: [...comments, {
          user_email: user.email,
          user_name: user.full_name || user.email.split('@')[0],
          text: comment,
          date: new Date().toISOString(),
        }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityPosts']);
      setNewComment('');
    },
  });

  const isLiked = (post) => post.liked_by?.includes(user?.email);

  const scoreColor = (score) => {
    if (score >= 75) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="text-center py-12">
          <Users className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Join the Community</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in to share your skin health journey</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">
            Sign In
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Community</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Share your skin health & glow score</p>
        </div>
        <Button onClick={openShareModal} className="bg-gradient-to-r from-pink-500 to-amber-500 flex-shrink-0">
          <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Share My Skin Insights</span>
          <span className="sm:hidden">Share</span>
        </Button>
      </div>

      {/* My Skin Snapshot */}
      {myAnalysis && (
        <GlassCard className="border border-pink-200 dark:border-pink-800">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-sm">Your Latest Skin Snapshot</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
              <p className={`text-2xl font-bold ${scoreColor(myAnalysis.overall_score)}`}>{myAnalysis.overall_score}</p>
              <p className="text-xs text-gray-500">Glow Score</p>
            </div>
            <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
              <p className="text-sm font-bold capitalize text-pink-500">{myAnalysis.skin_type || '—'}</p>
              <p className="text-xs text-gray-500">Skin Type</p>
            </div>
            <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
              <p className="text-2xl font-bold text-rose-400">{myAnalysis.acne_level ?? '—'}</p>
              <p className="text-xs text-gray-500">Acne</p>
            </div>
            <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-400">{myAnalysis.dark_spots ?? '—'}</p>
              <p className="text-xs text-gray-500">Dark Spots</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Posts Feed */}
      {isLoading ? (
        Array(3).fill(0).map((_, i) => (
          <GlassCard key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </GlassCard>
        ))
      ) : posts.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
          <p className="text-gray-500">Be the first to share your skin health!</p>
        </GlassCard>
      ) : (
        posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <GlassCard>
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-amber-400 text-white">
                    {post.user_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post.user_name}</p>
                  <p className="text-xs text-gray-500">{format(new Date(post.created_date), 'MMM d, yyyy')}</p>
                </div>
                {post.overall_score != null && (
                  <Badge className={`ml-auto ${post.overall_score >= 75 ? 'bg-emerald-500' : post.overall_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}>
                    <Trophy className="w-3 h-3 mr-1" />
                    Glow {post.overall_score}
                  </Badge>
                )}
              </div>

              {/* Skin Stats */}
              {(post.overall_score != null || post.skin_type || post.acne_level != null) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.skin_type && (
                    <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 text-xs px-3 py-1 rounded-full capitalize">
                      <Droplets className="w-3 h-3 inline mr-1" />{post.skin_type}
                    </span>
                  )}
                  {post.acne_level != null && (
                    <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 text-xs px-3 py-1 rounded-full">
                      Acne: {post.acne_level}/10
                    </span>
                  )}
                  {post.dark_spots != null && (
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 text-xs px-3 py-1 rounded-full">
                      Dark Spots: {post.dark_spots}/10
                    </span>
                  )}
                  {post.redness != null && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs px-3 py-1 rounded-full">
                      Redness: {post.redness}/10
                    </span>
                  )}
                </div>
              )}

              {/* Caption */}
              <p className="text-gray-700 dark:text-gray-300 mb-4">{post.caption}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => likeMutation.mutate(post)}
                  className={`flex items-center gap-2 ${isLiked(post) ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked(post) ? 'fill-current' : ''}`} />
                  <span>{post.likes_count || 0}</span>
                </button>
                <button
                  onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.comments?.length || 0}</span>
                </button>
              </div>

              {/* Comments */}
              <AnimatePresence>
                {selectedPost?.id === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                      {post.comments?.map((c, j) => (
                        <div key={j} className="flex gap-2">
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            <AvatarFallback className="text-xs bg-gray-200">{c.user_name?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 flex-1">
                            <p className="font-medium text-xs">{c.user_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && newComment.trim() && commentMutation.mutate({ post, comment: newComment })}
                      />
                      <Button
                        onClick={() => commentMutation.mutate({ post, comment: newComment })}
                        disabled={!newComment.trim() || commentMutation.isPending}
                        size="icon"
                        className="bg-pink-500"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        ))
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreatePost(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Share Skin Insights
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreatePost(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Auto-filled skin stats preview */}
                {myAnalysis && (
                  <div className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Your Skin Data (auto-attached)</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-pink-500">Glow Score: {myAnalysis.overall_score}</Badge>
                      {myAnalysis.skin_type && <Badge variant="outline" className="capitalize">{myAnalysis.skin_type}</Badge>}
                      {myAnalysis.acne_level != null && <Badge variant="outline">Acne: {myAnalysis.acne_level}/10</Badge>}
                      {myAnalysis.dark_spots != null && <Badge variant="outline">Spots: {myAnalysis.dark_spots}/10</Badge>}
                      {myAnalysis.redness != null && <Badge variant="outline">Redness: {myAnalysis.redness}/10</Badge>}
                    </div>
                  </div>
                )}

                {!myAnalysis && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-4 text-sm text-amber-700 dark:text-amber-300">
                    No skin analysis found. Run an analysis first to attach your skin data automatically.
                  </div>
                )}

                <Textarea
                  placeholder="Share your skin journey, tips, or how you're feeling about your skin health..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="mb-4"
                />

                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!caption.trim() || createMutation.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-amber-500"
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Post to Community</>
                  )}
                </Button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}