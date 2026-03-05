import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Plus, X, Loader2,
  Trophy, TrendingUp, Users, Camera, Send, UserPlus, UserMinus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';

export default function Community() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ caption: '', beforePhoto: null, afterPhoto: null });
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50),
  });

  const { data: myFollows = [] } = useQuery({
    queryKey: ['myFollows', user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      let beforeUrl = null;
      let afterUrl = null;

      if (data.beforePhoto) {
        const res = await base44.integrations.Core.UploadFile({ file: data.beforePhoto });
        beforeUrl = res.file_url;
      }
      if (data.afterPhoto) {
        const res = await base44.integrations.Core.UploadFile({ file: data.afterPhoto });
        afterUrl = res.file_url;
      }

      return base44.entities.CommunityPost.create({
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        caption: data.caption,
        before_photo: beforeUrl,
        after_photo: afterUrl,
        likes_count: 0,
        liked_by: [],
        comments: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityPosts']);
      setShowCreatePost(false);
      setNewPost({ caption: '', beforePhoto: null, afterPhoto: null });
      setBeforePreview(null);
      setAfterPreview(null);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const likedBy = post.liked_by || [];
      const isLiked = likedBy.includes(user.email);
      
      return base44.entities.CommunityPost.update(post.id, {
        liked_by: isLiked
          ? likedBy.filter(e => e !== user.email)
          : [...likedBy, user.email],
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

  const handleBeforeSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, beforePhoto: file });
      setBeforePreview(URL.createObjectURL(file));
    }
  };

  const handleAfterSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, afterPhoto: file });
      setAfterPreview(URL.createObjectURL(file));
    }
  };

  const isLiked = (post) => post.liked_by?.includes(user?.email);

  // Calculate leaderboard
  const leaderboard = posts
    .filter(p => p.improvement_percent)
    .sort((a, b) => (b.improvement_percent || 0) - (a.improvement_percent || 0))
    .slice(0, 10);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <Users className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Join the Community</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Sign in to share your skin journey and connect with others
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-pink-500 to-amber-500"
          >
            Sign In to Join
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Share your skin transformation journey
          </p>
        </div>
        <Button
          onClick={() => setShowCreatePost(true)}
          className="bg-gradient-to-r from-pink-500 to-amber-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Share Progress
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <GlassCard key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </GlassCard>
            ))
          ) : posts.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
              <p className="text-gray-500">Be the first to share your skin journey!</p>
            </GlassCard>
          ) : (
            posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <Link to={`${createPageUrl('PublicProfile')}?email=${post.user_email}`}>
                      <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-amber-400 text-white">
                          {post.user_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link to={`${createPageUrl('PublicProfile')}?email=${post.user_email}`}>
                        <p className="font-semibold hover:text-pink-500 transition-colors cursor-pointer">{post.user_name}</p>
                      </Link>
                      <p className="text-sm text-gray-500">
                        {format(new Date(post.created_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {post.improvement_percent && (
                      <Badge className="ml-auto bg-emerald-500">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {post.improvement_percent}% improvement
                      </Badge>
                    )}
                  </div>

                  {/* Before/After Images */}
                  {(post.before_photo || post.after_photo) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {post.before_photo && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 text-center">Before</p>
                          <img
                            src={post.before_photo}
                            alt="Before"
                            className="w-full h-48 object-cover rounded-xl"
                          />
                        </div>
                      )}
                      {post.after_photo && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 text-center">After</p>
                          <img
                            src={post.after_photo}
                            alt="After"
                            className="w-full h-48 object-cover rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Caption */}
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{post.caption}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => likeMutation.mutate(post)}
                      className={`flex items-center gap-2 ${
                        isLiked(post) ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'
                      }`}
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

                  {/* Comments Section */}
                  <AnimatePresence>
                    {selectedPost?.id === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      >
                        {post.comments?.map((comment, j) => (
                          <div key={j} className="flex gap-3 mb-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs bg-gray-200">
                                {comment.user_name?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                              <p className="font-medium text-sm">{comment.user_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
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
        </div>
      )}

      {/* Following Feed */}
      {activeTab === 'following' && (
        <div className="space-y-6">
          {(() => {
            const followingEmails = myFollows.map(f => f.following_email);
            const followingPosts = posts.filter(p => followingEmails.includes(p.user_email));
            return followingPosts.length === 0 ? (
              <GlassCard className="text-center py-12">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Follow People</h3>
                <p className="text-gray-500">Follow other users to see their posts here</p>
              </GlassCard>
            ) : followingPosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard>
                  <div className="flex items-center gap-3 mb-4">
                    <Link to={`${createPageUrl('PublicProfile')}?email=${post.user_email}`}>
                      <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-amber-400 text-white">
                          {post.user_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link to={`${createPageUrl('PublicProfile')}?email=${post.user_email}`}>
                        <p className="font-semibold hover:text-pink-500 cursor-pointer">{post.user_name}</p>
                      </Link>
                      <p className="text-sm text-gray-500">{format(new Date(post.created_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  {(post.before_photo || post.after_photo) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {post.before_photo && <img src={post.before_photo} alt="Before" className="w-full h-48 object-cover rounded-xl" />}
                      {post.after_photo && <img src={post.after_photo} alt="After" className="w-full h-48 object-cover rounded-xl" />}
                    </div>
                  )}
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{post.caption}</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => likeMutation.mutate(post)} className={`flex items-center gap-2 ${isLiked(post) ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}>
                      <Heart className={`w-5 h-5 ${isLiked(post) ? 'fill-current' : ''}`} />
                      <span>{post.likes_count || 0}</span>
                    </button>
                    <button onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)} className="flex items-center gap-2 text-gray-500 hover:text-blue-500">
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ));
          })()}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h3 className="text-xl font-semibold">Top Skin Transformations</h3>
          </div>
          
          {leaderboard.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No transformation data yet. Share your progress with improvement percentage!
            </p>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((post, i) => (
                <div
                  key={post.id}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    i === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20' :
                    i === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50' :
                    i === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20' :
                    'bg-gray-50 dark:bg-gray-800/30'
                  }`}
                >
                  <span className={`text-2xl font-bold ${
                    i === 0 ? 'text-amber-500' :
                    i === 1 ? 'text-gray-400' :
                    i === 2 ? 'text-orange-400' :
                    'text-gray-500'
                  }`}>
                    #{i + 1}
                  </span>
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-amber-400 text-white">
                      {post.user_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{post.user_name}</p>
                    <p className="text-sm text-gray-500">
                      {post.skin_journey_weeks} weeks journey
                    </p>
                  </div>
                  <Badge className="bg-emerald-500 text-lg px-4 py-1">
                    +{post.improvement_percent}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Create Post Modal */}
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
                  <h3 className="text-xl font-semibold">Share Your Progress</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreatePost(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBeforeSelect}
                  className="hidden"
                />
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAfterSelect}
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div
                    onClick={() => beforeInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-pink-400"
                  >
                    {beforePreview ? (
                      <img src={beforePreview} alt="Before" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Before Photo</p>
                      </>
                    )}
                  </div>
                  <div
                    onClick={() => afterInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-pink-400"
                  >
                    {afterPreview ? (
                      <img src={afterPreview} alt="After" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">After Photo</p>
                      </>
                    )}
                  </div>
                </div>

                <Textarea
                  placeholder="Share your skin journey story..."
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  rows={3}
                  className="mb-4"
                />

                <Button
                  onClick={() => createMutation.mutate(newPost)}
                  disabled={!newPost.caption.trim() || createMutation.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-amber-500"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Share Post'
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