"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Hash, Circle, AtSign, Loader2 } from 'lucide-react';

interface QuickMessage {
  _id: string;
  fromName: string;
  fromEmail: string;
  body: string;
  sentAt: string;
  type: 'direct' | 'channel' | 'messenger' | string;
  channelId?: string;
  isRead: boolean;
  isReadBy?: string[];
}

interface MessengerWidgetProps {
  profile: any;
  onOpenMessenger?: () => void;
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return '';
  }
}

const AVATAR_COLORS = [
  'from-violet-600 to-purple-700',
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-rose-600 to-pink-700',
  'from-amber-600 to-orange-700',
  'from-cyan-600 to-sky-700',
];

function colorForEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MessengerWidget({ profile, onOpenMessenger }: MessengerWidgetProps) {
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickMsg, setQuickMsg] = useState('');
  const [sendingQuick, setSendingQuick] = useState(false);
  const [activeTab, setActiveTab] = useState<'dm' | 'channels'>('dm');

  const currentEmail: string =
    (() => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
        if (!token) return profile?.email || '';
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(
          window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        )).email || profile?.email || '';
      } catch { return profile?.email || ''; }
    })();

  useEffect(() => {
    fetchRecent();
    const iv = setInterval(fetchRecent, 10000);
    return () => clearInterval(iv);
  }, []);

  const fetchRecent = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) { setLoading(false); return; }
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: QuickMessage[] = await res.json();
        setMessages(data.slice(-30).reverse());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const unreadCount = messages.filter(m => {
    if (m.fromEmail === currentEmail) return false;
    if (m.type === 'channel') return !m.isReadBy?.includes(currentEmail);
    return !m.isRead;
  }).length;

  const dmMessages = messages.filter(m =>
    m.type === 'direct' || m.type === 'messenger' ||
    (!m.channelId && m.type !== 'channel')
  );

  const channelMessages = messages.filter(m =>
    m.type === 'channel' || !!m.channelId
  );

  const displayMessages = activeTab === 'dm' ? dmMessages : channelMessages;

  const sendQuickMessage = async () => {
    if (!quickMsg.trim()) return;
    setSendingQuick(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: 'all',
          toName: 'General',
          subject: 'Quick Update',
          body: quickMsg.trim(),
          type: 'channel',
          channelId: 'general'
        })
      });
      setQuickMsg('');
      fetchRecent();
    } catch { /* ignore */ } finally {
      setSendingQuick(false);
    }
  };

  return (
    <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130] bg-gradient-to-r from-[#13141f] to-[#0f1117]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/30">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-none">Messages</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Team communication</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="min-w-[20px] h-5 px-1.5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
          <button
            onClick={onOpenMessenger}
            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-medium px-2 py-1 rounded-md hover:bg-violet-500/10"
          >
            Open →
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 pt-2.5 pb-0">
        {(['dm', 'channels'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === tab
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {tab === 'dm' ? <AtSign className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
            {tab === 'dm' ? 'Direct Messages' : 'Channels'}
            {tab === 'dm' && dmMessages.filter(m => m.fromEmail !== currentEmail && !m.isRead).length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0" style={{ maxHeight: '220px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-600">No messages yet</p>
            <p className="text-[10px] text-slate-700 mt-0.5">Start a conversation!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayMessages.slice(0, 12).map((msg, i) => {
              const isOwn = msg.fromEmail === currentEmail;
              const isUnread = !isOwn && (
                msg.type === 'channel' ? !msg.isReadBy?.includes(currentEmail) : !msg.isRead
              );
              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all group ${
                    isUnread
                      ? 'bg-violet-500/5 border border-violet-500/10 hover:bg-violet-500/10'
                      : 'hover:bg-white/3'
                  }`}
                  onClick={onOpenMessenger}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colorForEmail(msg.fromEmail)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                    {getInitials(msg.fromName)}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[11px] font-semibold truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                        {isOwn ? 'You' : msg.fromName}
                      </span>
                      {msg.channelId && (
                        <span className="text-[9px] text-violet-400/70 flex items-center gap-0.5">
                          <Hash className="w-2.5 h-2.5" />{msg.channelId}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-600 ml-auto flex-shrink-0">{timeAgo(msg.sentAt)}</span>
                    </div>
                    <p className={`text-[11px] truncate leading-tight ${isUnread ? 'text-slate-300' : 'text-slate-500'}`}>
                      {msg.body}
                    </p>
                  </div>
                  {isUnread && (
                    <Circle className="w-1.5 h-1.5 text-violet-500 fill-violet-500 mt-1 flex-shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Quick Send to #general */}
      <div className="px-3 pb-3 pt-2 border-t border-[#1e2130]">
        <div className="flex items-center gap-2 bg-[#1a1d2e] rounded-xl border border-[#252840] px-3 py-2 focus-within:border-violet-500/50 transition-colors">
          <Hash className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <input
            type="text"
            value={quickMsg}
            onChange={e => setQuickMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuickMessage(); } }}
            placeholder="Message #general..."
            className="flex-1 bg-transparent text-[12px] text-slate-300 placeholder-slate-600 outline-none"
          />
          <button
            onClick={sendQuickMessage}
            disabled={!quickMsg.trim() || sendingQuick}
            className="w-6 h-6 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:opacity-50 flex items-center justify-center transition-all flex-shrink-0"
          >
            {sendingQuick ? (
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            ) : (
              <Send className="w-3 h-3 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
