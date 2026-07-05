"use client";

import React, { useState, useEffect } from 'react';
import { 
  Share2, Hash, Heart, Flame, Award, ThumbsUp, Send, Paperclip, MessageSquare, 
  Search, Flag, Shield, Pin, Bell, Trash2, Edit3, X, User, ExternalLink, Check, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface Attachment {
  name: string;
  url: string;
  fileType: string;
}

interface PostCreator {
  name: string;
  email: string;
  role: string;
  department?: string;
  avatar?: string;
}

interface PostType {
  _id: string;
  title?: string;
  content: string;
  attachments?: Attachment[];
  tags?: string[];
  pinned?: boolean;
  createdBy: PostCreator;
  reactions?: { emoji: string; users: string[] }[];
  createdAt: string;
}

interface CommentType {
  _id: string;
  postId: string;
  parentId?: string;
  content: string;
  createdBy: PostCreator;
  reactions?: { emoji: string; users: string[] }[];
  createdAt: string;
}

interface NotificationType {
  _id: string;
  sender: { name: string; avatar?: string };
  type: string;
  postId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface ReportType {
  _id: string;
  contentType: 'post' | 'comment';
  contentId: string;
  reason: string;
  reportedBy: string;
  status: string;
  createdAt: string;
}

export default function CommunityFeed({
  profile = { name: 'Employee', email: 'emp@hr.com', role: 'Employee' },
  addNotification = () => {}
}: {
  profile?: any;
  addNotification?: (msg: string) => void;
}) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTagFilter, setActiveTagFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementsOnly, setAnnouncementsOnly] = useState(false);
  
  // Comments thread state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<CommentType[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);

  // Trending metrics
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);

  // Notifications and reports
  const [feedNotifications, setFeedNotifications] = useState<NotificationType[]>([]);
  const [reportsList, setReportsList] = useState<ReportType[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showModeratorPanel, setShowModeratorPanel] = useState(false);

  // Simulated media upload state
  const [uploadFile, setUploadFile] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Active employees list from database
  const [employees, setEmployees] = useState<any[]>([]);

  const isAdminOrHR = profile.role === 'Admin' || profile.role === 'HR';

  // Load auth token
  const getHeaders = () => {
    const token = localStorage.getItem('hr_system_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchFeed = async () => {
    try {
      const q = new URLSearchParams();
      if (searchQuery) q.set('search', searchQuery);
      if (activeTagFilter) q.set('tag', activeTagFilter);
      if (announcementsOnly) q.set('announcements', 'true');

      const res = await fetch(`/api/feed/posts?${q.toString()}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch('/api/feed/trending', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setTrendingPosts(data.trendingPosts);
        setTrendingTags(data.trendingTags);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/feed/notifications', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setFeedNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    if (!isAdminOrHR) return;
    try {
      const res = await fetch('/api/feed/reports', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setReportsList(data.reports);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch employees for feed:", e);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchTrending();
    fetchNotifications();
    fetchReports();
    fetchEmployees();

    // Set interval for real-time polling to simulate websocket activity
    const interval = setInterval(() => {
      fetchFeed();
      fetchNotifications();
      fetchTrending();
      fetchEmployees();
      if (isAdminOrHR) fetchReports();
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTagFilter, searchQuery, announcementsOnly]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    try {
      const postTags = [...selectedTags];
      // Automatically detect hashtags from text
      const regex = /#\w+/g;
      const detected = newPostText.match(regex);
      if (detected) {
        detected.forEach(tag => {
          if (!postTags.includes(tag.toLowerCase())) {
            postTags.push(tag.toLowerCase());
          }
        });
      }

      const payload = {
        title: newPostTitle || undefined,
        content: newPostText,
        tags: postTags,
        attachments: uploadFile ? [uploadFile] : [],
        pinned: false
      };

      const res = await fetch('/api/feed/posts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setNewPostText('');
        setNewPostTitle('');
        setSelectedTags([]);
        setUploadFile(null);
        addNotification("Social Feed Post Shared!");
        fetchFeed();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle reaction on a post
  const handleToggleReaction = async (postId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/feed/posts/${postId}/reactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ emoji })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p._id === postId ? data.post : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle post pin action (moderators)
  const handleTogglePin = async (postId: string, currentPinStatus: boolean) => {
    try {
      const res = await fetch(`/api/feed/posts/${postId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ pinned: !currentPinStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchFeed();
        addNotification(`Post ${!currentPinStatus ? 'Pinned to Top' : 'Unpinned'}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      const res = await fetch(`/api/feed/posts/${postId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchFeed();
        addNotification("Post deleted successfully");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load comments
  const loadComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/posts/${postId}/comments`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setCommentsList(data.comments);
        setActiveCommentsPostId(postId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create comment / reply
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentsPostId) return;

    try {
      const res = await fetch(`/api/feed/posts/${activeCommentsPostId}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          content: newCommentText,
          parentId: replyToCommentId || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewCommentText('');
        setReplyToCommentId(null);
        loadComments(activeCommentsPostId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/feed/comments/${commentId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        if (activeCommentsPostId) loadComments(activeCommentsPostId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Content Report
  const handleReportContent = async (type: 'post' | 'comment', id: string) => {
    const reason = window.prompt("Reason for reporting this content:");
    if (!reason) return;
    try {
      const res = await fetch('/api/feed/reports', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          contentType: type,
          contentId: id,
          reason
        })
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Content reported to administrators.");
        fetchReports();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications as read
  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/feed/notifications', {
        method: 'PUT',
        headers: getHeaders()
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Actual file upload using Cloudinary / local fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('hr_system_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
        setUploadFile({
          name: file.name,
          url: data.url,
          fileType
        });
        addNotification("File uploaded successfully!");
      } else {
        alert(data.error || "File upload failed");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error uploading file: " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full min-h-[90vh] bg-transparent font-sans text-left">
      
      {/* 1. LEFT SIDEBAR */}
      <div className="w-full lg:w-56 flex flex-col gap-4 shrink-0">
        
        {/* User Quick Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-650 font-black text-lg shadow-inner border border-indigo-200/50 dark:border-indigo-900/30">
              {profile.name[0]}
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">{profile.name}</h3>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{profile.role}</p>
            </div>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-3" />
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400 font-bold">Feed posts</span>
            <span className="font-black text-slate-850 dark:text-white">{posts.length}</span>
          </div>
        </div>

        {/* Shortcuts / Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm space-y-3">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Feed Categories</h4>
          
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => { setActiveTagFilter(''); setAnnouncementsOnly(false); }} 
              className={cn("w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 flex items-center gap-2 border-none cursor-pointer", 
                !activeTagFilter && !announcementsOnly 
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-400 rounded-r-lg" 
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 bg-transparent"
              )}
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>All Workspace Feed</span>
            </button>

            <button 
              onClick={() => { setAnnouncementsOnly(true); setActiveTagFilter(''); }} 
              className={cn("w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 flex items-center gap-2 border-none cursor-pointer", 
                announcementsOnly 
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-400 rounded-r-lg" 
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 bg-transparent"
              )}
            >
              <Pin className="w-3.5 h-3.5 shrink-0" />
              <span>Announcements</span>
            </button>
          </div>

          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-slate-800">Hashtags</h4>
          <div className="flex flex-wrap gap-1">
            {['#project', '#announcement', '#development', '#hr', '#fun', '#help'].map(tag => (
              <button
                key={tag}
                onClick={() => { setActiveTagFilter(activeTagFilter === tag ? '' : tag); setAnnouncementsOnly(false); }}
                className={cn("px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-150 cursor-pointer border-none", 
                  activeTagFilter === tag 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* System Operations Toggle (Admins/HR) */}
        {isAdminOrHR && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-4 shadow-lg text-white space-y-2.5">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Moderator Suite</span>
            </div>
            <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">Review content flagged by workspace members.</p>
            <button 
              onClick={() => setShowModeratorPanel(!showModeratorPanel)}
              className="w-full h-8.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-none"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{showModeratorPanel ? 'Close Dashboard' : 'Open flagged items'}</span>
            </button>
          </div>
        )}

      </div>

      {/* 2. CENTER PANEL (FEED & POSTING) */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Search Header */}
        <div className="flex gap-2 items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl px-3.5 py-2 shadow-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search posts, employees, discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-[11px] outline-none text-slate-850 dark:text-white placeholder:text-slate-450"
          />
          
          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotificationsModal(!showNotificationsModal); handleMarkNotificationsRead(); }}
              className="p-1 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-xl relative border-none bg-transparent cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              {feedNotifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* CREATE POST COMPOSER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm space-y-3.5">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-extrabold text-xs text-slate-650 shrink-0">
                {profile.name[0]}
              </div>
              <div className="flex-1 space-y-1">
                <input 
                  type="text" 
                  placeholder="Post title (optional)" 
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[11px] font-black uppercase text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <textarea 
                  placeholder="Share a project milestone, achievement, or start a discussion... (use #tags)" 
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[11px] font-semibold resize-none text-slate-800 dark:text-slate-200 placeholder:text-slate-450 min-h-[50px]"
                />
              </div>
            </div>

            {/* Simulated attachment preview */}
            {uploadFile && (
              <div className="p-2.5 bg-slate-55/40 dark:bg-slate-850 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-xs">{uploadFile.name}</span>
                </div>
                <button onClick={() => setUploadFile(null)} className="text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <input 
                  type="file" 
                  id="feed-file-upload" 
                  className="hidden" 
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload} 
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('feed-file-upload')?.click()}
                  disabled={isUploading}
                  className="h-7.5 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer flex items-center gap-1.5 text-[11px] text-slate-500"
                >
                  <Paperclip className="w-3 h-3" />
                  <span>{isUploading ? 'Uploading...' : 'Media'}</span>
                </button>
              </div>

              <button 
                type="submit" 
                disabled={!newPostText.trim()}
                className="h-8 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider text-white rounded-xl shadow-md disabled:opacity-50 border-none flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Share Update</span>
              </button>
            </div>
          </form>
        </div>

        {/* FLAG/REPORTED DASHBOARD FOR ADMINS */}
        <AnimatePresence>
          {showModeratorPanel && reportsList.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 rounded-3xl p-5 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Flagged Flagged workspace reports
                </h3>
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-450 text-[9px] font-black rounded-full uppercase tracking-wider leading-none">
                  {reportsList.length} Items pending review
                </span>
              </div>
              
              <div className="grid gap-3">
                {reportsList.map(report => (
                  <div key={report._id} className="p-3 bg-white dark:bg-slate-900 border border-rose-200/40 dark:border-rose-900/30 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-extrabold uppercase text-[10px] text-slate-500">Flagged Type: {report.contentType}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-300 mt-1 leading-snug">"{report.reason}"</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">By: {report.reportedBy}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          if (report.contentType === 'post') {
                            await handleDeletePost(report.contentId);
                          } else {
                            await handleDeleteComment(report.contentId);
                          }
                          fetchReports();
                        }}
                        className="h-7 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-black uppercase text-[9px] tracking-wider border-none cursor-pointer"
                      >
                        Delete Flagged Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FEED POSTS STREAM */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {posts.map(post => {
              const myReactions = post.reactions || [];
              const totalReactions = myReactions.reduce((acc, curr) => acc + curr.users.length, 0);

              return (
                <motion.div 
                  key={post._id}
                  layoutId={post._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn("bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm space-y-3.5 transition-all", 
                    post.pinned ? "border-indigo-400 dark:border-indigo-650 bg-indigo-50/10 dark:bg-indigo-950/5" : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  {/* Pinned Marker */}
                  {post.pinned && (
                    <div className="flex items-center gap-1 text-[8.5px] font-black text-indigo-500 uppercase tracking-widest pb-1 border-b border-indigo-100/40">
                      <Pin className="w-2.5 h-2.5" />
                      <span>Pinned Announcement</span>
                    </div>
                  )}

                  {/* Header info */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                        <img src={post.createdBy.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.createdBy.email}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="text-left">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{post.createdBy.name}</h4>
                        <div className="flex items-center gap-1 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          <span>{post.createdBy.role}</span>
                          <span>•</span>
                          <span>{post.createdBy.department}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick moderation tools */}
                    <div className="flex gap-1">
                      {isAdminOrHR && (
                        <button 
                          onClick={() => handleTogglePin(post._id, post.pinned || false)}
                          className={cn("p-1 rounded-lg border-none bg-transparent cursor-pointer transition-colors", 
                            post.pinned ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:bg-slate-50"
                          )}
                          title="Pin Announcement"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      )}

                      {(isAdminOrHR || post.createdBy.email === profile.email) && (
                        <button 
                          onClick={() => handleDeletePost(post._id)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border-none bg-transparent cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      <button 
                        onClick={() => handleReportContent('post', post._id)}
                        className="p-1 text-slate-450 hover:bg-slate-50 rounded-lg border-none bg-transparent cursor-pointer"
                        title="Report Content"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2.5">
                    {post.title && (
                      <h3 className="font-extrabold text-[13px] text-slate-900 dark:text-white uppercase tracking-wider leading-snug">{post.title}</h3>
                    )}
                    <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed font-semibold whitespace-pre-line">{post.content}</p>
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map(t => (
                          <span key={t} className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Image Attachment Rendering */}
                    {post.attachments && post.attachments.map((file, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200/40 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 max-h-64">
                        {file.fileType === 'image' ? (
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-3 flex items-center gap-2.5">
                            <Paperclip className="w-5 h-5 text-indigo-500" />
                            <div>
                              <p className="text-[11px] font-extrabold">{file.name}</p>
                              <a href={file.url} download className="text-[8px] font-black uppercase text-indigo-600 tracking-wider">Download PDF</a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Reactions Summary */}
                  {totalReactions > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-455 tracking-wider uppercase border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="flex gap-0.5">
                          {myReactions.map(r => (
                            <span key={r.emoji}>{r.emoji}</span>
                          ))}
                        </span>
                        <span>{totalReactions} reactions</span>
                      </div>
                    </div>
                  )}

                  {/* Reactions bar */}
                  <div className="flex justify-between items-center pt-0.5 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex gap-1 relative group">
                      <button 
                        onClick={() => handleToggleReaction(post._id, '👍')}
                        className="h-7.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer flex items-center gap-1 text-[10.5px] font-extrabold uppercase text-slate-500 tracking-wide"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>React</span>
                      </button>

                      {/* Floating reaction picker popover */}
                      <div className="absolute bottom-8.5 left-0 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 shadow-2xl hidden group-hover:flex gap-2 z-40">
                        {['👍', '❤️', '🎉', '🔥', '👏'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(post._id, emoji)}
                            className="hover:scale-130 transition-transform text-base cursor-pointer border-none bg-transparent p-0"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (activeCommentsPostId === post._id) {
                          setActiveCommentsPostId(null);
                        } else {
                          loadComments(post._id);
                        }
                      }}
                      className="h-7.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer flex items-center gap-1 text-[10.5px] font-extrabold uppercase text-slate-500 tracking-wide"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Comments</span>
                    </button>
                  </div>

                  {/* COMMENTS SECTION */}
                  {activeCommentsPostId === post._id && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                      
                      {/* Thread Replies */}
                      <div className="space-y-2.5">
                        {commentsList.map(comment => (
                          <div key={comment._id} className="flex items-start gap-2 text-[11px] text-left">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-205">
                              <img src={comment.createdBy.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.createdBy.email}`} alt="User" className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="flex-1 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl relative group">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-extrabold uppercase tracking-wide text-[9px] text-slate-850 dark:text-white">{comment.createdBy.name}</span>
                                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              
                              <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-355">{comment.content}</p>

                              {/* Actions on comments */}
                              <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
                                {(isAdminOrHR || comment.createdBy.email === profile.email) && (
                                  <button 
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="p-0.5 hover:bg-rose-105 text-slate-400 hover:text-rose-600 rounded cursor-pointer border-none bg-transparent"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Comment Input */}
                      <form onSubmit={handlePostComment} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Write a comment..." 
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-[11px] font-bold outline-none"
                        />
                        <button 
                          type="submit" 
                          disabled={!newCommentText.trim()}
                          className="p-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl disabled:opacity-50 border-none cursor-pointer flex items-center justify-center shrink-0"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>

                    </div>
                  )}

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>

      {/* 3. RIGHT PANEL */}
      <div className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
        
        {/* Trending posts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm space-y-3 text-left">
          <h4 className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Trending Topics</h4>
          
          <div className="flex flex-col gap-2.5">
            {trendingPosts.length > 0 ? (
              trendingPosts.map(tp => (
                <div key={tp._id} className="space-y-0.5">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wide leading-tight text-slate-850 dark:text-white truncate">
                    {tp.title}
                  </h5>
                  <div className="flex gap-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    <span>{tp.reactionCount} reacts</span>
                    <span>•</span>
                    <span>{tp.commentCount} comments</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[9px] font-bold text-slate-455 uppercase">No active discussions yet.</p>
            )}
          </div>
        </div>

        {/* Active Teammates online panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm space-y-3 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Active Members</h4>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex flex-col gap-2.5">
            {employees.length > 0 ? (
              employees.map((usr, uIdx) => {
                const initials = usr.fullName
                  ? usr.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  : 'EM';
                return (
                  <div key={uIdx} className="flex items-center gap-2">
                    <div className="w-5.5 h-5.5 bg-slate-105 dark:bg-slate-850 rounded flex items-center justify-center text-[8px] font-black text-slate-600 shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-850 dark:text-white uppercase tracking-wider leading-none mb-0.5">{usr.fullName}</p>
                      <p className="text-[7px] text-slate-450 font-bold uppercase tracking-wider">{usr.designation || usr.role || 'Member'}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[9px] font-bold text-slate-455 uppercase">No active members.</p>
            )}
          </div>
        </div>

      </div>

      {/* NOTIFICATIONS MODAL OVERLAY */}
      <AnimatePresence>
        {showNotificationsModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500" /> Workspace Activity
                </h3>
                <button 
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-1 hover:bg-slate-50 rounded border-none bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {feedNotifications.length > 0 ? (
                  feedNotifications.map(notif => (
                    <div 
                      key={notif._id} 
                      className={cn("p-3 rounded-2xl flex items-start gap-3 border text-xs text-left", 
                        notif.read ? "bg-slate-50/50 border-slate-100 dark:bg-slate-950/10 dark:border-slate-850" : "bg-indigo-50/30 border-indigo-150/50 dark:bg-indigo-950/10"
                      )}
                    >
                      <div className="w-7 h-7 rounded bg-slate-100 overflow-hidden shrink-0 border">
                        <img src={notif.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.sender.name}`} alt="User" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-700 dark:text-slate-350">
                          <span className="font-extrabold text-slate-850 dark:text-white uppercase">{notif.sender.name}</span> {notif.content}
                        </p>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-450 text-[10px] font-black uppercase tracking-widest">
                    No notifications yet.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
