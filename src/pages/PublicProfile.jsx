import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UserPlus, UserMinus, Heart, MessageCircle, MapPin,
  Sparkles, TrendingUp, ArrowLeft, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import GlassCard from '@/components/ui/GlassCard';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function PublicProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isOwnProfile = currentUser?.email === profileEmail;

  const { data: profile } = useQuery({
    queryKey: ['userProfile', profileEmail],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: profileEmail }),
    enabled: !!profileEmail,
    select: (data) => data[0] || null,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['userPosts', profileEmail],
    queryFn: () => base44.entities.CommunityPost.filter({ user_email: profileEmail }, '-created_date', 20),
    enabled: !!profileEmail,
  });

  const { data: skinAnalysis } = useQuery({
    queryKey: ['publicSkinAnalysis', profileEmail],
    queryFn: async () => {
      const analyses = await base44.entities.SkinAnalysis.filter({ user_email: profileEmail }, '-created_date', 1);
      return analyses[0] || null;
    },
    enabled: !!profileEmail,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', profileEmail],
    queryFn: () => base44.entities.Follow.filter({ following_email: profileEmail }),
    enabled: !!profileEmail,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', profileEmail],
    queryFn: () => base44.entities.Follow.filter({ follower_email: profileEmail }),
    enabled: !!profileEmail,
  });

  const { data: myFollows = [] } = useQuery({
    queryKey: ['myFollows', currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const isFollowing = myFollows.some(f => f.following_email === profileEmail);
  const followRecord = myFollows.find(f => f.following_email === profileEmail);

  const followMutation = useMutation({
    mutationFn: () => base44.entities.Follow.create({ follower_email: currentUser.email, following_email: profileEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries(['followers', profileEmail]);
      queryClient.invalidateQueries(['myFollows', currentUser?.email]);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => base44.entities.Follow.delete(followRecord.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['followers', profileEmail]);
      queryClient.invalidateQueries(['myFollows', currentUser?.email]);
    },
  });

  const displayName = profile?.display_name || profileEmail?.split('@')[0] || 'User';
  const initials = displayName[0]?.toUpperCase();

  if (!profileEmail) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-gray-500">No profile specified.</p>
        <Link to={createPageUrl('Community')}><Button className="mt-4">Back to Community</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link to={createPageUrl('Community')} className="flex items-center gap-2 text-gray-500 hover:text-pink-500 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Community</span>
      </Link>

      {/* Profile Header */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-24 h-24 flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-amber-400 text-white text-3xl">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {profile?.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1 justify-center sm:justify-start mt-1">
                <MapPin className="w-3 h-3" />{profile.location}
              </p>
            )}
            {profile?.bio && <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{profile.bio}</p>}

            {profile?.skin_concern_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 justify-center sm:justify-start">
                {profile.skin_concern_tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs capitalize">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 mt-4 justify-center sm:justify-start">
              <div className="text-center">
                <p className="text-xl font-bold">{posts.length}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{followers.length}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{following.length}</p>
                <p className="text-xs text-gray-500">Following</p>
              </div>
            </div>
          </div>

          {/* Follow Button */}
          {currentUser && !isOwnProfile && (
            <div className="flex-shrink-0">
              {isFollowing ? (
                <Button
                  variant="outline"
                  onClick={() => unfollowMutation.mutate()}
                  disabled={unfollowMutation.isPending}
                >
                  <UserMinus className="w-4 h-4 mr-2" />Unfollow
                </Button>
              ) : (
                <Button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className="bg-gradient-to-r from-pink-500 to-amber-500"
                >
                  <UserPlus className="w-4 h-4 mr-2" />Follow
                </Button>
              )}
            </div>
          )}
          {isOwnProfile && (
            <Link to={createPageUrl('Profile')}>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </Link>
          )}
        </div>
      </GlassCard>

      {/* Skin Info (if public) */}
      {skinAnalysis && profile?.skin_type_public !== false && (
        <GlassCard>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Skin Profile
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3 text-center flex-1 min-w-[80px]">
              <p className="text-2xl font-bold text-pink-500">{skinAnalysis.overall_score}</p>
              <p className="text-xs text-gray-500">Skin Score</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center flex-1 min-w-[80px]">
              <p className="text-sm font-bold text-amber-600 capitalize">{skinAnalysis.skin_type}</p>
              <p className="text-xs text-gray-500">Skin Type</p>
            </div>
            {skinAnalysis.acne_level > 0 && (
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 text-center flex-1 min-w-[80px]">
                <p className="text-2xl font-bold text-rose-500">{skinAnalysis.acne_level}/10</p>
                <p className="text-xs text-gray-500">Acne</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Posts */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4 text-pink-500" />
          Posts ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <GlassCard className="text-center py-10">
            <p className="text-gray-400">No posts yet</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard>
                  {(post.before_photo || post.after_photo) && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {post.before_photo && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 text-center">Before</p>
                          <img src={post.before_photo} alt="Before" className="w-full h-40 object-cover rounded-xl" />
                        </div>
                      )}
                      {post.after_photo && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 text-center">After</p>
                          <img src={post.after_photo} alt="After" className="w-full h-40 object-cover rounded-xl" />
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{post.caption}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{post.likes_count || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{post.comments?.length || 0}</span>
                    {post.improvement_percent && (
                      <Badge className="bg-emerald-500 ml-auto">
                        <TrendingUp className="w-3 h-3 mr-1" />+{post.improvement_percent}%
                      </Badge>
                    )}
                    <span className="ml-auto text-xs">{format(new Date(post.created_date), 'MMM d')}</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}