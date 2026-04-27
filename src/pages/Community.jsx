import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Plus, X, Loader2, Sparkles, Send, Droplets, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Community() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState('');
  const [openComments, setOpenComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50),
  });

  const { data: myAnalysis } = useQuery({
    queryKey: ['mySkinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const openShare = () => {
    if (myAnalysis) {
      const concerns = [
        myAnalysis.acne_level > 5 && 'acne',
        myAnalysis.dark_spots > 5 && 'dark spots',
        myAnalysis.redness > 5 && 'redness',
        myAnalysis.oiliness > 5 && 'oiliness',
      ].filter(Boolean);
      setCaption(`My skin score is ${myAnalysis.overall_score}/100 (${myAnalysis.skin_type} skin).${concerns.length ? ` Working on: ${concerns.join(', ')}.` : ''} Sharing my glow journey! 🌟`);
    } else {
      setCaption('');
    }
    setShowCreate(true);
  };

  const createMutation = useMutation({
    mutationFn: () => base44.entities.CommunityPost.create({
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
    onSuccess: () => { queryClient.invalidateQueries(['communityPosts']); setShowCreate(false); setCaption(''); },
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const liked = post.liked_by || [];
      const isLiked = liked.includes(user.email);
      return base44.entities.CommunityPost.update(post.id, {
        liked_by: isLiked ? liked.filter(e => e !== user.email) : [...liked, user.email],
        likes_count: isLiked ? (post.likes_count || 1) - 1 : (post.likes_count || 0) + 1,
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['communityPosts']),
  });

  const commentMutation = useMutation({
    mutationFn: ({ post, comment }) => base44.entities.CommunityPost.update(post.id, {
      comments: [...(post.comments || []), {
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        text: comment,
        date: new Date().toISOString(),
      }],
    }),
    onSuccess: () => { queryClient.invalidateQueries(['communityPosts']); setNewComment(''); },
  });

  const scoreColor = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#f43f5e';

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto pt-16 text-center px-4">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>👥</div>
        <h2 className="text-2xl font-black mb-2">Join the Community</h2>
        <p className="text-gray-500 mb-6">Sign in to share your skin journey</p>
        <button onClick={() => base44.auth.redirectToLogin()} className="px-8 py-3 rounded-2xl font-bold text-white ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>👥</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Community</h1>
            <p className="text-sm text-gray-500">Share your glow journey</p>
          </div>
        </div>
        <button onClick={openShare} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          <Plus className="w-4 h-4" /> Share
        </button>
      </div>

      {/* My Skin Snapshot */}
      {myAnalysis && (
        <div className="mb-5 p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">My Skin Snapshot</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Score', val: myAnalysis.overall_score, color: scoreColor(myAnalysis.overall_score) },
              { label: 'Type', val: myAnalysis.skin_type?.slice(0, 4) || '—', color: '#f472b6' },
              { label: 'Acne', val: myAnalysis.acne_level ?? '—', color: '#ef4444' },
              { label: 'Spots', val: myAnalysis.dark_spots ?? '—', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 text-center">
                <p className="text-lg font-black capitalize" style={{ color: s.color }}>{s.val}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="rounded-3xl bg-white border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded-xl w-1/3 mb-3" />
              <div className="h-16 bg-gray-100 rounded-2xl" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-white border border-gray-100">
            <div className="text-5xl mb-3">✨</div>
            <p className="font-black text-lg mb-1">No posts yet</p>
            <p className="text-sm text-gray-400 mb-4">Be the first to share your skin journey!</p>
            <button onClick={openShare} className="px-6 py-2.5 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
              Share Now
            </button>
          </div>
        ) : (
          posts.map((post, i) => {
            const isLiked = post.liked_by?.includes(user?.email);
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

                {/* Post header */}
                <div className="p-4 pb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                    {post.user_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{post.user_name}</p>
                    <p className="text-xs text-gray-400">{format(new Date(post.created_date), 'MMM d, yyyy')}</p>
                  </div>
                  {post.overall_score != null && (
                    <div className="px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1" style={{ background: `${scoreColor(post.overall_score)}15`, color: scoreColor(post.overall_score) }}>
                      <Trophy className="w-3 h-3" /> {post.overall_score}
                    </div>
                  )}
                </div>

                {/* Skin tags */}
                {(post.skin_type || post.acne_level != null) && (
                  <div className="flex gap-1.5 px-4 mb-3 flex-wrap">
                    {post.skin_type && <Badge className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"><Droplets className="w-2.5 h-2.5 mr-0.5" />{post.skin_type}</Badge>}
                    {post.acne_level != null && <Badge variant="outline" className="text-xs">Acne {post.acne_level}/10</Badge>}
                    {post.dark_spots != null && <Badge variant="outline" className="text-xs">Spots {post.dark_spots}/10</Badge>}
                  </div>
                )}

                {/* Caption */}
                <p className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{post.caption}</p>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-5">
                  <button onClick={() => user && likeMutation.mutate(post)}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}>
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {post.likes_count || 0}
                  </button>
                  <button onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-blue-500 transition-all">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments?.length || 0}
                  </button>
                </div>

                {/* Comments */}
                <AnimatePresence>
                  {openComments === post.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100 dark:border-gray-800">
                      <div className="p-4 space-y-2">
                        {post.comments?.map((c, j) => (
                          <div key={j} className="flex gap-2">
                            <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                              {c.user_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2 flex-1">
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{c.user_name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-300">{c.text}</p>
                            </div>
                          </div>
                        ))}
                        {post.comments?.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No comments yet</p>}
                        <div className="flex gap-2 mt-2">
                          <input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && newComment.trim() && commentMutation.mutate({ post, comment: newComment })}
                            className="flex-1 px-3 py-2 rounded-2xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-pink-300 transition-all"
                          />
                          <button onClick={() => newComment.trim() && commentMutation.mutate({ post, comment: newComment })}
                            disabled={!newComment.trim() || commentMutation.isPending}
                            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(15,10,30,0.72)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ y: 60, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full max-w-md rounded-3xl overflow-hidden bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-lg">Share Your Skin Journey</p>
                    <p className="text-xs text-gray-400">Inspire the community ✨</p>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>
                </div>

                {myAnalysis && (
                  <div className="mb-4 p-3 rounded-2xl flex flex-wrap gap-1.5" style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.2)' }}>
                    <p className="w-full text-xs font-bold text-pink-600 mb-1">Auto-attached skin data</p>
                    <Badge className="bg-pink-500 text-white text-xs">Score: {myAnalysis.overall_score}</Badge>
                    {myAnalysis.skin_type && <Badge variant="outline" className="text-xs capitalize">{myAnalysis.skin_type}</Badge>}
                    {myAnalysis.acne_level != null && <Badge variant="outline" className="text-xs">Acne: {myAnalysis.acne_level}/10</Badge>}
                  </div>
                )}

                <textarea
                  placeholder="Share your skin journey, tips, or progress..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all mb-4"
                  style={{ background: '#fafafa' }}
                />

                <button onClick={() => createMutation.mutate()} disabled={!caption.trim() || createMutation.isPending}
                  className="w-full py-3 rounded-2xl font-black text-white disabled:opacity-50 ios-button-3d"
                  style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Posting...</> : <><Sparkles className="w-4 h-4 inline mr-2" />Post to Community</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}