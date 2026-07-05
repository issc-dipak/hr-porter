"use client";

import React, { useState } from 'react';
import { Heart, MessageSquare, Send, Sparkles, User, Loader2, Smile } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['Teamwork', 'Leadership', 'Innovation', 'Support', 'Customer Success', 'Learning', 'Quality', 'Excellence'];
const CATEGORY_COLORS: Record<string, string> = {
  Teamwork: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Leadership: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Innovation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Support: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Customer Success': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Learning: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Quality: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Excellence: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
};

interface Props {
  appreciations: any[];
  employees: any[];
  onAddAppreciation: (data: { recipientId: string; message: string; category: string }) => Promise<void>;
  onLike: (id: string) => Promise<void>;
  onComment: (id: string, text: string) => Promise<void>;
  myEmployeeId: string;
}

export default function RecognitionWall({ appreciations, employees, onAddAppreciation, onLike, onComment, myEmployeeId }: Props) {
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Teamwork');
  const [posting, setPosting] = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !message.trim()) return;
    setPosting(true);
    await onAddAppreciation({ recipientId, message, category });
    setMessage('');
    setRecipientId('');
    setPosting(false);
  };

  const handlePostComment = async (postId: string) => {
    const text = commentTexts[postId] || '';
    if (!text.trim()) return;
    await onComment(postId, text);
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Add Post Panel ── */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 h-fit space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          Share Appreciation
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Recipient Employee *</label>
            <select
              value={recipientId}
              onChange={e => setRecipientId(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500"
            >
              <option value="">Select teammate...</option>
              {employees.filter(emp => emp._id !== myEmployeeId).map(emp => (
                <option key={emp._id} value={emp._id}>{emp.fullName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500"
              >
                {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Message *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Thanks Rahul for helping me complete the Payroll Module."
              required
              rows={3}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={posting || !recipientId || !message.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Post Appreciation
          </button>
        </form>
      </div>

      {/* ── social Feed ── */}
      <div className="lg:col-span-2 space-y-4">
        {appreciations.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-12 text-center text-slate-500">
            <Smile className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Appreciation Wall is empty. Be the first to post!</p>
          </div>
        ) : (
          appreciations.map((post) => {
            const hasLiked = post.likes?.includes(myEmployeeId);
            const isCommentsActive = activeCommentsPostId === post._id;

            return (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                      {post.senderName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        {post.senderName} <span className="text-slate-500 font-normal">appreciated</span> {post.recipientName}
                      </p>
                      <p className="text-[10px] text-slate-500">{post.senderRole || 'Team Member'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Teamwork}`}>
                    {post.category}
                  </span>
                </div>

                {/* Message */}
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed pl-11">
                  "{post.message}"
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pl-11 pt-2 border-t border-slate-800/30 text-xs">
                  <button
                    onClick={() => onLike(post._id)}
                    className={`flex items-center gap-1 transition-colors ${hasLiked ? 'text-rose-500' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                    <span>{post.likes?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => setActiveCommentsPostId(isCommentsActive ? null : post._id)}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                </div>

                {/* Comments section */}
                {isCommentsActive && (
                  <div className="pl-11 pt-3 space-y-3 border-t border-slate-800/40">
                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input
                        value={commentTexts[post._id] || ''}
                        onChange={e => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                        placeholder="Write a comment..."
                        onKeyDown={e => { if (e.key === 'Enter') handlePostComment(post._id); }}
                        className="flex-1 bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs outline-none text-slate-200 focus:border-violet-500"
                      />
                      <button
                        onClick={() => handlePostComment(post._id)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Comments List */}
                    {post.comments?.length > 0 && (
                      <div className="space-y-2">
                        {post.comments.map((comment: any, idx: number) => (
                          <div key={idx} className="bg-slate-800/40 p-2 rounded-xl border border-slate-800/50 flex gap-2 items-start">
                            <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                              {comment.userName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-300">{comment.userName}</span>
                                <span className="text-[9px] text-slate-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
