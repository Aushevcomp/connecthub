"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/feed/PostCard";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { enrichPosts } from "@/lib/posts";
import { syncProfileFollowCounts } from "@/lib/social";
import { timeAgo, formatNumber } from "@/lib/utils";
import { sendNotification } from "@/lib/notifications";
import { MapPin, Users, Link as LinkIcon, Calendar, Loader2, ArrowLeft, UserPlus, UserMinus, Building2, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { Profile, Post } from "@/types";

function UserProfileContent() {
  const params = useParams();
  const profileId = params.id as string;
  const { user: currentUser, openAuthModal } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    if (!profileId) return;

    async function fetchAll() {
      setLoading(true);
      const supabase = createClient();

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
        setFollowersCount(profileData.followers_count || 0);
      }
      setLoading(false);

      // Check follow status
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", authUser.id)
          .eq("following_id", profileId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      // Fetch posts
      setPostsLoading(true);
      const { data: postsData } = await supabase
        .from("posts")
        .select("*, author:profiles!posts_author_id_fkey(*)")
        .eq("author_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20);
      const postsList = await enrichPosts(
        supabase,
        (postsData || []) as Post[],
        authUser?.id
      );

      setPosts(postsList);
      setPostsLoading(false);
    }

    fetchAll();
  }, [profileId]);

  const handleFollow = async () => {
    if (!currentUser) { openAuthModal(); return; }
    setFollowLoading(true);
    try {
      const supabase = createClient();
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", profileId);
        const { followersCount: nextFollowersCount } = await syncProfileFollowCounts(supabase, profileId);
        await syncProfileFollowCounts(supabase, currentUser.id);
        setFollowersCount(nextFollowersCount);
        setProfile((prev) => prev ? { ...prev, followers_count: nextFollowersCount } : prev);
        setIsFollowing(false);
      } else {
        await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: profileId });
        sendNotification({ userId: profileId, actorId: currentUser.id, type: "follow", message: "подписался(-ась) на вас", link: `/profile/${currentUser.id}` });
        const { followersCount: nextFollowersCount } = await syncProfileFollowCounts(supabase, profileId);
        await syncProfileFollowCounts(supabase, currentUser.id);
        setFollowersCount(nextFollowersCount);
        setProfile((prev) => prev ? { ...prev, followers_count: nextFollowersCount } : prev);
        setIsFollowing(true);
      }
    } catch (err) { console.error("Follow error:", err); }
    finally { setFollowLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3 opacity-30">🔍</div>
        <p className="text-text-secondary mb-4">Профиль не найден</p>
        <Link href="/" className="btn-primary inline-flex"><ArrowLeft size={16} /> На главную</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const isCompany = profile.account_type === "business";
  const isHidden = profile.profile_public === false && !isOwnProfile;

  if (isHidden) {
    return (
      <div className="card p-10 text-center">
        <div className="text-5xl mb-3 opacity-30">🔒</div>
        <p className="font-semibold mb-1">Профиль скрыт</p>
        <p className="text-sm text-text-secondary">
          Пользователь ограничил публичный доступ к профилю.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Banner */}
      <div className="h-44 rounded-card relative"
        style={{
          background: profile.banner_url
            ? `url(${profile.banner_url}) center/cover`
            : isCompany
              ? "linear-gradient(135deg, #06d6a0, #0ea5e9, #6366f1)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
        }}>
        <div className="absolute -bottom-12 left-6 border-4 border-bg-primary rounded-full">
          <Avatar name={profile.name} size={96} src={profile.avatar_url} isCompany={isCompany} />
        </div>
      </div>

      {/* Info */}
      <div className="mt-16 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              {profile.name}
              {profile.is_verified && (
                <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              {isCompany && (
                <span className="text-[10px] font-bold text-accent2 bg-accent2-soft px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Building2 size={10} /> Компания
                </span>
              )}
            </h1>
            <p className="text-text-secondary mt-1">
              {profile.role || (isCompany ? "Бизнес-аккаунт" : "Специалист")}
              {profile.company ? ` @ ${profile.company}` : ""}
            </p>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-tertiary">
              {profile.location && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
              )}
              <span className="flex items-center gap-1">
                <Users size={14} /> {formatNumber(followersCount)} подписчиков
              </span>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-accent transition-colors">
                  <LinkIcon size={14} /> {profile.website.replace(/https?:\/\//, "")}
                </a>
              )}
              {(profile.show_email || isOwnProfile) && (
                <span className="flex items-center gap-1">
                  <Mail size={14} /> {profile.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {timeAgo(profile.created_at)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {isOwnProfile ? (
              <Link href="/profile" className="btn-ghost text-sm">Редактировать</Link>
            ) : (
              <>
                {currentUser ? (
                  <Link href={`/messages?user=${profile.id}`} className="btn-ghost text-sm">
                    <MessageSquare size={14} /> Написать
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => openAuthModal("login")}
                  >
                    <MessageSquare size={14} /> Написать
                  </button>
                )}
                <button
                  className={isFollowing ? "btn-ghost text-sm" : "btn-primary text-sm"}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isFollowing ? (
                    <><UserMinus size={14} /> Отписаться</>
                  ) : (
                    <><UserPlus size={14} /> Подписаться</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-text-secondary leading-relaxed">{profile.bio}</p>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {profile.skills.map((s) => <span key={s} className="tag-tech">{s}</span>)}
          </div>
        )}
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          Публикации {posts.length > 0 && `(${posts.length})`}
        </h2>
        {postsLoading ? (
          <div className="card p-8 text-center">
            <Loader2 size={24} className="animate-spin text-accent mx-auto" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3 opacity-30">📝</div>
            <p className="text-text-secondary">Пока нет публикаций</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfileByIdPage() {
  return (
    <AppShell>
      <UserProfileContent />
    </AppShell>
  );
}
