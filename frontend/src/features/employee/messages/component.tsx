"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Hash, Lock, Send, Paperclip, MessageSquare, Search, Shield, Pin, 
  Bell, Trash2, Edit3, X, User, ExternalLink, Check, AlertCircle, 
  Smile, MoreVertical, Plus, Info, Users, FolderOpen, Download, 
  Eye, CornerDownRight, ChevronRight, Volume2, UserCheck, CheckCheck,
  Copy, CornerUpRight, Settings, Upload, Mail, Phone, MapPin, Calendar,
  BookOpen, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useChatStore, ChatMessage, ChatConversation, ChatUser } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

// Emojis list for reactions
const PRESET_EMOJIS = ['👍', '❤️', '🔥', '👏', '😂', '😮'];

export default function WorkplaceChat({
  profile = { name: 'Employee', email: 'emp@hr.com', role: 'Employee', companyId: 'company_001' },
  addNotification = () => {}
}: {
  profile?: any;
  addNotification?: (msg: string) => void;
}) {
  const {
    socket,
    connected,
    currentUser,
    conversations,
    activeConversationId,
    messages,
    onlineUsers,
    typingUsers,
    initSocket,
    disconnectSocket,
    setActiveConversation,
    loadConversations,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    setTyping
  } = useChatStore();

  const [employees, setEmployees] = useState<any[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [chatDisplayName, setChatDisplayName] = useState('');
  const [chatStatusText, setChatStatusText] = useState('');
  const [chatStatusEmoji, setChatStatusEmoji] = useState('');
  const [chatPresence, setChatPresence] = useState('online');
  const [chatMuteSound, setChatMuteSound] = useState(false);
  const [chatNotifLevel, setChatNotifLevel] = useState('all');
  const [chatDndActive, setChatDndActive] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(profile);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'announcements' | 'files'>('chat');
  const [searchText, setSearchText] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [isDmSearchFocused, setIsDmSearchFocused] = useState(false);

  // UI Panels
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [systemWorkspaceName, setSystemWorkspaceName] = useState('Acme Workspace');
  const [showWorkspaceNameModal, setShowWorkspaceNameModal] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState('');

  // Form states
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [channelPrivate, setChannelPrivate] = useState(false);

  // Edit channel states
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDesc, setEditChannelDesc] = useState('');
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ channelId: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Messaging input states
  const [messageText, setMessageText] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);

  // Mention suggest state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Forward message states
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const systemRole = (typeof window !== 'undefined' ? localStorage.getItem('hr_system_role') : null) || profile.role;
  const isAdminOrHR = systemRole === 'Admin' || systemRole === 'HR';

  const fetchSystemSettings = async () => {
    const token = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/settings/system', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.chat?.workspaceName) {
          setSystemWorkspaceName(data.chat.workspaceName);
        } else if (data.company?.name) {
          setSystemWorkspaceName(data.company.name);
        }
      }
    } catch (err) {
      console.error("Failed to load system settings:", err);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('hr_system_token');
    if (token && !socket) {
      initSocket(token);
    }
    fetchEmployees();
    loadConversations();
    fetchUserSettings();
    fetchSystemSettings();
  }, []);

  useEffect(() => {
    if (profile) {
      setUserProfile(profile);
    }
  }, [profile]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      
      osc.start();
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.12);
      
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (err) {
      console.error('Failed to play notification chime:', err);
    }
  };

  const prevMessagesCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const currentCounts: Record<string, number> = {};
    let hasNewMessage = false;

    Object.keys(messages).forEach(convId => {
      const msgsList = messages[convId] || [];
      currentCounts[convId] = msgsList.length;

      const prevCount = prevMessagesCountRef.current[convId] || 0;
      if (msgsList.length > prevCount) {
        const lastMsg = msgsList[msgsList.length - 1];
        if (lastMsg && lastMsg.fromEmail.toLowerCase() !== profile.email.toLowerCase()) {
          hasNewMessage = true;
        }
      }
    });

    if (hasNewMessage && !chatMuteSound && !chatDndActive) {
      playChime();
    }

    prevMessagesCountRef.current = currentCounts;
  }, [messages, chatMuteSound, chatDndActive, profile.email]);

  useEffect(() => {
    if (!socket) return;

    const handleUserSettingsUpdate = ({ email, chatSettings, bio }: any) => {
      setEmployees(prev => prev.map(emp => {
        if (emp.email.toLowerCase() === email.toLowerCase()) {
          return {
            ...emp,
            bio: bio !== undefined ? bio : emp.bio,
            chatSettings: chatSettings !== undefined ? chatSettings : emp.chatSettings
          };
        }
        return emp;
      }));
    };

    socket.on('user_settings_update', handleUserSettingsUpdate);
    return () => {
      socket.off('user_settings_update', handleUserSettingsUpdate);
    };
  }, [socket]);

  const fetchUserSettings = async () => {
    const token = localStorage.getItem('hr_system_token');
    if (!token) return;
    try {
      const res = await fetch('/api/settings/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.chatSettings) {
          const cs = data.settings.chatSettings;
          setChatDisplayName(cs.chatDisplayName || '');
          setChatStatusText(cs.chatStatusText || '');
          setChatStatusEmoji(cs.chatStatusEmoji || '');
          setChatPresence(cs.chatPresence || 'online');
          setChatMuteSound(cs.chatMuteSound || false);
          setChatNotifLevel(cs.chatNotifLevel || 'all');
          setChatDndActive(cs.chatDndActive || false);
        }
        if (data.profile) {
          setUserProfile(data.profile);
        }
      }
    } catch (err) {
      console.error("Failed to load user settings:", err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const token = localStorage.getItem('hr_system_token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const payload = {
        profile: userProfile,
        chatSettings: {
          chatDisplayName,
          chatStatusText,
          chatStatusEmoji,
          chatPresence,
          chatMuteSound,
          chatNotifLevel,
          chatDndActive
        }
      };

      const res = await fetch('/api/settings/user', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addNotification("Settings updated successfully!");
        setShowSettingsModal(false);
        // Sync global auth store so changes propagate
        if (userProfile?.profilePicture) {
          useAuthStore.getState().setProfile({ 
            profilePicture: userProfile.profilePicture,
            name: userProfile.fullName || userProfile.name
          });
        }
        fetchUserSettings();
      } else {
        alert("Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: data
      });

      if (res.ok) {
        const json = await res.json();
        setUserProfile((prev: any) => ({
          ...prev,
          profilePicture: json.url
        }));
        addNotification("Avatar image uploaded. Click Save to persist changes.");
      } else {
        alert("Failed to upload profile photo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading profile photo.");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteProfilePhoto = () => {
    setUserProfile((prev: any) => ({
      ...prev,
      profilePicture: ''
    }));
    addNotification("Profile photo cleared. Click Save to persist changes.");
  };

  // Poll for latest channels/DMs list
  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, activeConversationId]);

  useEffect(() => {
    const recipientEmail = localStorage.getItem('chat_recipient_email');
    if (recipientEmail) {
      localStorage.removeItem('chat_recipient_email');
      handleStartDmChat(recipientEmail);
    }
  }, []);

  // Fetch employees list
  const fetchEmployees = async () => {
    const token = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/employees', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  };

  const handleDeleteChannel = (channelId: string, name: string) => {
    if (name === 'general' || name === 'announcements') {
      addNotification('Cannot delete default system channels!');
      return;
    }
    setDeleteConfirm({ channelId, name });
  };

  const confirmDeleteChannel = async () => {
    if (!deleteConfirm) return;
    const { channelId, name } = deleteConfirm;
    setIsDeleting(true);
    const token = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch(`/api/chat/channels/${channelId}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        addNotification(`Channel #${name} deleted successfully`);
        setActiveConversation(null);
        loadConversations();
        setDeleteConfirm(null);
      } else {
        const err = await res.json();
        addNotification(err.error || 'Failed to delete channel');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    if (!editChannelName.trim()) return;

    const token = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch(`/api/chat/channels/${editingChannel._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: editChannelName,
          description: editChannelDesc
        })
      });

      if (res.ok) {
        const result = await res.json();
        addNotification(`Channel #${editChannelName} updated successfully`);
        setShowEditChannelModal(false);
        setEditingChannel(null);
        setEditChannelName('');
        setEditChannelDesc('');
        loadConversations();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update channel");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating channel");
    }
  };

  const handleInviteMember = async (email: string) => {
    if (!currentConv) return;
    const token = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch(`/api/chat/channels/${currentConv._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'invite', email })
      });
      if (res.ok) {
        addNotification(`${email.split('@')[0]} added to channel successfully`);
        loadConversations();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add member to channel");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartDmChat = async (recipientEmail: string) => {
    setDmSearchQuery('');
    const token = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: 'dm',
          members: [recipientEmail]
        })
      });
      if (res.ok) {
        await loadConversations();
        const user = profile.email.toLowerCase().trim();
        const partner = recipientEmail.toLowerCase().trim();
        const convId = user < partner ? `${user}|${partner}` : `${partner}|${user}`;
        setActiveConversation(convId);
      }
    } catch (err) {
      console.error("Failed to start DM chat:", err);
    }
  };

  // Perform Global Search
  const handleGlobalSearch = async (val: string) => {
    setSearchText(val);
    if (!val.trim()) {
      setGlobalSearchResults(null);
      return;
    }
    setIsSearching(true);
    const token = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch(`/api/chat/search?q=${encodeURIComponent(val)}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle creating channel
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    const token = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/chat/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: channelName,
          description: channelDesc,
          isPrivate: channelPrivate,
          type: channelPrivate ? 'private' : 'company'
        })
      });
      if (res.ok) {
        const result = await res.json();
        addNotification(`Channel #${channelName} created!`);
        setShowChannelModal(false);
        setChannelName('');
        setChannelDesc('');
        setChannelPrivate(false);
        loadConversations();
        if (result.data?._id) {
          setActiveConversation(result.data._id);
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create channel");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle direct file uploading
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name;
    const fileSize = file.size;
    const fileType = file.type;

    setIsUploading(true);
    const token = localStorage.getItem('hr_system_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/chat/upload-file', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSelectedAttachments(prev => [
          ...prev,
          {
            name: fileName,
            url: data.url,
            type: fileType.startsWith('image/') ? 'image' : 'document',
            size: fileSize
          }
        ]);
        addNotification("File attached to composer!");
      } else {
        alert(data.error || "File upload failed");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Input Changes & Mentions Suggestion
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessageText(val);

    // Typing Status Sync
    if (activeConversationId) {
      setTyping(activeConversationId, val.length > 0);
    }

    // Mentions dropdown checker
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  // Select mention suggest item
  const handleSelectMention = (emp: any) => {
    if (!mentionQuery && mentionQuery !== '') return;
    const cursor = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = messageText.substring(0, cursor);
    const textAfterCursor = messageText.substring(cursor);
    const baseText = textBeforeCursor.replace(/@\w*$/, `@${emp.email} `);
    setMessageText(baseText + textAfterCursor);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  // Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && selectedAttachments.length === 0) return;

    const currentConv = conversations.find(c => c._id === activeConversationId);
    if (!currentConv) return;

    const payload: any = {
      body: messageText,
      type: currentConv.type,
      attachments: selectedAttachments,
      mentions: messageText.match(/@([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi)?.map(m => m.slice(1)) || []
    };

    if (currentConv.type === 'channel') {
      payload.channelId = currentConv._id;
    } else {
      const partnerEmail = currentConv.members?.find(m => m !== profile.email) || currentConv.members?.[0] || '';
      payload.toEmail = partnerEmail;
    }

    setMessageText('');
    setSelectedAttachments([]);
    setMentionQuery(null);
    setTyping(currentConv._id, false);

    await sendMessage(payload);
  };

  const handleCopyMessage = (text: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      addNotification("Message text copied to clipboard!");
    }
  };

  const handleForwardMessage = async (targetConv: ChatConversation) => {
    if (!forwardingMessage) return;
    
    const payload: any = {
      body: `[Forwarded] ${forwardingMessage.body}`,
      type: targetConv.type,
      attachments: forwardingMessage.attachments || [],
      mentions: []
    };

    if (targetConv.type === 'channel') {
      payload.channelId = targetConv._id;
    } else {
      const partnerEmail = targetConv.members?.find(m => m !== profile.email) || targetConv.members?.[0] || '';
      payload.toEmail = partnerEmail;
    }

    await sendMessage(payload);
    addNotification(`Message forwarded to ${targetConv.type === 'channel' ? '#' + targetConv.name : targetConv.name}`);
    setForwardingMessage(null);
    setForwardSearch('');
  };

  const getPartnerInfo = (conv: ChatConversation) => {
    let partnerEmail = conv.members?.find(m => m !== profile.email) || '';
    if (!partnerEmail && conv.type === 'direct') {
      partnerEmail = profile.email || '';
    }
    const matchedEmp = employees.find(e => e.email.toLowerCase() === partnerEmail.toLowerCase());
    const isOnline = partnerEmail.toLowerCase() === profile.email.toLowerCase()
      ? (chatPresence === 'online')
      : (onlineUsers.includes(partnerEmail.toLowerCase()) && matchedEmp?.chatSettings?.chatPresence !== 'away');
    const isDnd = partnerEmail.toLowerCase() === profile.email.toLowerCase()
      ? chatDndActive
      : !!matchedEmp?.chatSettings?.chatDndActive;
    const statusColor = isOnline ? (isDnd ? "bg-rose-500" : "bg-emerald-500") : "bg-slate-400";
    
    return {
      name: matchedEmp?.chatSettings?.chatDisplayName || matchedEmp?.fullName || (partnerEmail.toLowerCase() === profile.email.toLowerCase() ? (profile.name || partnerEmail.split('@')[0]) : (conv.name || partnerEmail.split('@')[0])),
      avatar: matchedEmp?.profilePicture || (partnerEmail.toLowerCase() === profile.email.toLowerCase() ? (profile.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerEmail}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerEmail}`),
      role: matchedEmp?.designation || (partnerEmail.toLowerCase() === profile.email.toLowerCase() ? profile.role : 'Workspace Member'),
      isOnline,
      isDnd,
      statusColor,
      chatSettings: partnerEmail.toLowerCase() === profile.email.toLowerCase() ? {
        chatPresence,
        chatStatusEmoji,
        chatStatusText,
        chatMuteSound,
        chatNotifLevel,
        chatDndActive
      } : matchedEmp?.chatSettings,
      email: partnerEmail
    };
  };

  const currentConv = conversations.find(c => c._id === activeConversationId);
  const activeConversationMessages = activeConversationId ? (messages[activeConversationId] || []) : [];
  const activeTypingUsers = typingUsers.filter(u => u.isTyping && u.email !== profile.email);

  // Filter conversations
  const publicChannels = conversations.filter(c => c.type === 'channel' && !c.isPrivate);
  const privateChannels = conversations.filter(c => c.type === 'channel' && c.isPrivate);
  const dmConversations = conversations.filter(c => c.type === 'direct');

  // Filter files shared in this workspace
  const getSharedFiles = () => {
    const list: any[] = [];
    activeConversationMessages.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          list.push({
            ...att,
            senderName: msg.fromName,
            sentAt: msg.sentAt,
            messageId: msg._id
          });
        });
      }
    });
    return list;
  };

  return (
    <div className="flex flex-row flex-1 w-full h-[calc(100vh-24px)] min-h-0 bg-white dark:bg-slate-955 font-sans text-left overflow-hidden border border-slate-150/40 dark:border-slate-850 rounded-3xl shadow-sm">
      
      {/* 1. LEFT SIDEBAR */}
      <div className={cn(
        "w-full md:w-64 border-r border-slate-150/40 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/80 backdrop-blur-md flex flex-col shrink-0 h-full",
        activeConversationId ? "hidden md:flex" : "flex"
      )}>
        
        {/* Workspace Title & Connection status */}
        <div className="p-4 border-b border-slate-150/40 dark:border-slate-850 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">Workplace Chat</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {connected ? 'Live Sync Active' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 select-none min-w-0">
              <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 truncate max-w-[160px]" title={systemWorkspaceName}>
                {systemWorkspaceName}
              </span>
              {profile.role === 'Admin' && (
                <button 
                  onClick={() => {
                    setWorkspaceNameInput(systemWorkspaceName);
                    setShowWorkspaceNameModal(true);
                  }}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-555 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer border-none bg-transparent flex items-center justify-center shrink-0"
                  title="Edit Company Name"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          {(profile.role === 'Admin' || profile.role === 'HR' || profile.role === 'Employee') && (
            <button 
              onClick={() => setShowChannelModal(true)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border-none cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Chats List Scroller */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Employee DM Search bar */}
          <div className="px-2 mb-3 relative z-30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee to chat..."
                value={dmSearchQuery}
                onChange={(e) => setDmSearchQuery(e.target.value)}
                onFocus={() => setIsDmSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsDmSearchFocused(false), 200)}
                className="w-full h-9 pl-9 pr-3 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800/80 outline-none rounded-xl text-slate-850 dark:text-slate-200 placeholder:text-slate-400 placeholder:text-[10px] placeholder:font-semibold"
              />
              {dmSearchQuery && (
                <button 
                  onClick={() => setDmSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 bg-transparent border-none cursor-pointer p-0 flex items-center"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* DM Search Results Dropdown Overlay */}
            {dmSearchQuery.trim() && (
              <div className="absolute left-2 right-2 top-full mt-1 z-[180] chat-search-dropdown rounded-xl p-1.5 max-h-48 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {employees
                  .filter(e => e.email.toLowerCase() !== profile.email.toLowerCase() && (
                    !dmSearchQuery.trim() || 
                    e.fullName.toLowerCase().includes(dmSearchQuery.toLowerCase()) || 
                    e.email.toLowerCase().includes(dmSearchQuery.toLowerCase())
                  ))
                  .map(emp => (
                    <button
                      key={emp.email}
                      onClick={() => handleStartDmChat(emp.email)}
                      className="w-full text-left px-2 py-1.5 rounded-lg border-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer flex items-center gap-2"
                    >
                      <img src={emp.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`} className="w-5 h-5 rounded-lg object-cover shrink-0" />
                      <div className="truncate">
                        <p className="leading-none text-slate-800 dark:text-slate-250 font-bold truncate">{emp.fullName}</p>
                      </div>
                    </button>
                  ))}
                {employees.filter(e => e.email.toLowerCase() !== profile.email.toLowerCase() && (
                  !dmSearchQuery.trim() || 
                  e.fullName.toLowerCase().includes(dmSearchQuery.toLowerCase()) || 
                  e.email.toLowerCase().includes(dmSearchQuery.toLowerCase())
                )).length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-1">No colleagues found</p>
                )}
              </div>
            )}
          </div>

          {/* CHANNELS SECTION */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-2 py-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Channels</span>
              <button 
                onClick={() => setShowChannelModal(true)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-805 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg border-none bg-transparent cursor-pointer active:scale-95 transition-all"
                title="Create Channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Public channels */}
            {publicChannels.map(ch => (
              <div
                key={ch._id}
                onMouseEnter={() => setHoveredChannelId(ch._id)}
                onMouseLeave={() => setHoveredChannelId(null)}
                className={cn("w-full flex items-center justify-between px-2 py-0.5 rounded-xl transition-all text-xs",
                  activeConversationId === ch._id
                    ? "bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/30"
                )}
              >
                <button
                  onClick={() => setActiveConversation(ch._id)}
                  className="flex-1 text-left bg-transparent border-none cursor-pointer flex items-center gap-2 truncate text-xs font-semibold py-1 text-inherit"
                >
                  <Hash className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">#{ch.name}</span>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {ch.unreadCount > 0 && hoveredChannelId !== ch._id && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-[9px] font-black rounded-full text-white">{ch.unreadCount}</span>
                  )}
                  {ch.name !== 'general' && ch.name !== 'announcements' && hoveredChannelId === ch._id && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChannel(ch);
                          setEditChannelName(ch.name);
                          setEditChannelDesc(ch.description || '');
                          setShowEditChannelModal(true);
                        }}
                        style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                        title="Edit Channel"
                      >
                        <Edit3 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChannel(ch._id, ch.name);
                        }}
                        style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                        title="Delete Channel"
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Private channels */}
            {privateChannels.map(ch => (
              <div
                key={ch._id}
                onMouseEnter={() => setHoveredChannelId(ch._id)}
                onMouseLeave={() => setHoveredChannelId(null)}
                className={cn("w-full flex items-center justify-between px-2 py-0.5 rounded-xl transition-all text-xs",
                  activeConversationId === ch._id
                    ? "bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/30"
                )}
              >
                <button
                  onClick={() => setActiveConversation(ch._id)}
                  className="flex-1 text-left bg-transparent border-none cursor-pointer flex items-center gap-2 truncate text-xs font-semibold py-1 text-inherit"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">#{ch.name}</span>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {ch.unreadCount > 0 && hoveredChannelId !== ch._id && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-[9px] font-black rounded-full text-white">{ch.unreadCount}</span>
                  )}
                  {ch.name !== 'general' && ch.name !== 'announcements' && hoveredChannelId === ch._id && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChannel(ch);
                          setEditChannelName(ch.name);
                          setEditChannelDesc(ch.description || '');
                          setShowEditChannelModal(true);
                        }}
                        style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                        title="Edit Channel"
                      >
                        <Edit3 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChannel(ch._id, ch.name);
                        }}
                        style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                        title="Delete Channel"
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* DIRECT MESSAGES SECTION */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-2 py-1 pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Direct Messages</span>
            </div>
            {employees
              .filter(emp => emp.email.toLowerCase() !== profile.email.toLowerCase())
              .map(emp => {
                const isOnline = onlineUsers.includes(emp.email.toLowerCase()) && emp.chatSettings?.chatPresence !== 'away';
                const isDnd = emp.chatSettings?.chatDndActive;
                const statusColor = isOnline ? (isDnd ? "bg-rose-500" : "bg-emerald-500") : "bg-slate-400";
                const avatar = emp.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`;
                
                // Find if there is an existing conversation
                const dm = dmConversations.find(c => c.members?.map(m => m.toLowerCase()).includes(emp.email.toLowerCase()));
                const isSelected = dm ? activeConversationId === dm._id : false;
                const unreadCount = dm ? dm.unreadCount : 0;
                
                return (
                  <button
                    key={emp.email}
                    onClick={async () => {
                      if (dm) {
                        setActiveConversation(dm._id);
                      } else {
                        await handleStartDmChat(emp.email);
                      }
                    }}
                    className={cn("w-full text-left px-2.5 py-1.5 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-between text-xs",
                      isSelected
                        ? "bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/30"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative shrink-0">
                        <img src={avatar} alt="partner" className="w-5 h-5 rounded-lg object-cover" />
                        <span className={cn("absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-slate-900", statusColor)} />
                      </div>
                      <span className="truncate">{emp.chatSettings?.chatDisplayName || emp.fullName || emp.email.split('@')[0]}</span>
                      {emp.chatSettings?.chatStatusEmoji && (
                        <span className="text-[11px]" title={emp.chatSettings.chatStatusText}>{emp.chatSettings.chatStatusEmoji}</span>
                      )}
                      {isDnd && (
                        <span className="text-[7px] font-black uppercase tracking-wide text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.25 rounded border border-rose-150/50 shrink-0">DND</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-[9px] font-black rounded-full text-white">{unreadCount}</span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Current user footer */}
        <div className="p-3 pb-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-150/40 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              {userProfile?.profilePicture ? (
                <img 
                  src={userProfile?.profilePicture} 
                  alt="Profile" 
                  className="w-7 h-7 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => setShowSettingsModal(true)}
                />
              ) : (
                <div 
                  className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-indigo-650 cursor-pointer hover:bg-indigo-200 transition-colors"
                  onClick={() => setShowSettingsModal(true)}
                >
                  {profile.name ? profile.name[0] : 'E'}
                </div>
              )}
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900",
                chatPresence === 'online'
                  ? (chatDndActive ? "bg-rose-500" : "bg-emerald-500")
                  : "bg-slate-400"
              )} />
            </div>
            <div className="truncate text-left">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none mb-0.5">{profile.name}</h4>
              <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-450">{profile.role}</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 hover:bg-slate-250 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all border-none bg-transparent cursor-pointer"
            title="Chat Profile & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CENTER PANEL (CHAT CONTENT) */}
      <div className={cn(
        "flex-1 min-w-0 flex flex-col h-full bg-transparent dark:bg-transparent",
        activeConversationId ? "flex" : "hidden md:flex"
      )}>
        
        {/* Global Search Bar & Active Channel Header */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0">
          {/* Header metadata */}
          <div className="flex items-center gap-2.5 min-w-0">
            {currentConv && (
              <button
                onClick={() => setActiveConversation(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 cursor-pointer border-none bg-transparent md:hidden mr-1 flex items-center justify-center shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {currentConv ? (
              <>
                {currentConv.type === 'channel' ? (
                  currentConv.isPrivate ? <Lock className="w-4 h-4 text-slate-500" /> : <Hash className="w-4 h-4 text-slate-500" />
                ) : (
                  <span className={cn("w-2 h-2 rounded-full shrink-0", getPartnerInfo(currentConv).statusColor)} />
                )}
                <div 
                  className="text-left truncate cursor-pointer hover:opacity-85 select-none active:scale-[0.99] transition-all"
                  onClick={() => setShowRightSidebar(!showRightSidebar)}
                >
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    {currentConv.type === 'channel' ? currentConv.name : getPartnerInfo(currentConv).name}
                    {currentConv.type !== 'channel' && (() => {
                      const partner = getPartnerInfo(currentConv);
                      return (
                        <>
                          {partner.chatSettings?.chatStatusEmoji && (
                            <span className="text-xs" title={partner.chatSettings.chatStatusText}>
                              {partner.chatSettings.chatStatusEmoji}
                            </span>
                          )}
                          {partner.isDnd && (
                            <span className="text-[7px] font-black uppercase tracking-wide text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.25 rounded border border-rose-150/50 shrink-0">DND</span>
                          )}
                        </>
                      );
                    })()}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5 flex items-center gap-1">
                    {currentConv.type === 'channel' ? (
                      currentConv.description || 'No description set'
                    ) : (() => {
                      const partner = getPartnerInfo(currentConv);
                      return (
                        <>
                          <span>{partner.role}</span>
                          {partner.chatSettings?.chatStatusText && (
                            <span className="text-slate-400 dark:text-slate-500 italic pl-1 border-l border-slate-200 dark:border-slate-800">
                              "{partner.chatSettings.chatStatusText}"
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-xs font-bold text-slate-450">Select a discussion to begin messaging</span>
            )}
          </div>

          {/* Search box & Toggle Sidebar */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search messages, channels..."
                value={searchText}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs bg-slate-100 dark:bg-slate-900 border-none outline-none rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-450"
              />
              {searchText && (
                <button onClick={() => handleGlobalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 bg-transparent border-none cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentConv && (
              <button 
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-950 rounded-lg text-slate-500 cursor-pointer border-none bg-transparent"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Search Results Panel */}
        {globalSearchResults ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/10">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Search Results for "{searchText}"</h2>
              <button onClick={() => setGlobalSearchResults(null)} className="px-3 py-1 text-[10px] font-black uppercase bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-350 border-none rounded-lg cursor-pointer">
                Clear
              </button>
            </div>

            {/* Channels results */}
            {globalSearchResults.channels?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Matching Channels</h3>
                <div className="grid gap-2">
                  {globalSearchResults.channels.map((ch: any) => (
                    <div 
                      key={ch._id} 
                      onClick={() => { setActiveConversation(ch._id); setGlobalSearchResults(null); }}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-400"
                    >
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-bold">#{ch.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-1">{ch.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages results */}
            {globalSearchResults.messages?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Matching Messages</h3>
                <div className="grid gap-2.5">
                  {globalSearchResults.messages.map((msg: any) => (
                    <div key={msg._id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400">{msg.fromName} in {msg.toName || 'General'}</span>
                        <span className="text-[9px] text-slate-400">{new Date(msg.sentAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">{msg.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employee results */}
            {globalSearchResults.employees?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Matching Employees</h3>
                <div className="grid gap-2">
                  {globalSearchResults.employees.map((emp: any) => (
                    <div 
                      key={emp.email}
                      onClick={async () => {
                        const targetConv = conversations.find(c => c.type === 'direct' && c.members?.map(m => m.toLowerCase()).includes(emp.email.toLowerCase()));
                        if (targetConv) {
                          setActiveConversation(targetConv._id);
                        } else {
                          await handleStartDmChat(emp.email);
                        }
                        setGlobalSearchResults(null);
                      }}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-indigo-400"
                    >
                      <img src={emp.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{emp.fullName}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{emp.designation} • {emp.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* MESSAGES LOG VIEW */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-0">
              {activeConversationMessages.map((msg: ChatMessage) => {
                const isMyMessage = msg.fromEmail.toLowerCase() === profile.email.toLowerCase();
                
                return (
                  <div key={msg._id} className="group flex items-start gap-2.5 text-left">
                    <img 
                      src={msg.fromAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.fromEmail}`} 
                      alt="avatar" 
                      className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-100 dark:border-slate-800 mt-0.5" 
                    />
                    
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-baseline gap-2">
                        {(() => {
                          const isMe = msg.fromEmail.toLowerCase() === profile.email.toLowerCase();
                          const sender = isMe ? null : employees.find(e => e.email.toLowerCase() === msg.fromEmail.toLowerCase());
                          const senderName = isMe ? (chatDisplayName || profile.name) : (sender?.chatSettings?.chatDisplayName || msg.fromName);
                          return (
                            <span className="text-[11.5px] font-black capitalize tracking-wide text-indigo-650 dark:text-indigo-400">
                              {senderName}
                            </span>
                          );
                        })()}
                        {msg.fromRole && (
                          <span className="text-[7px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-1 py-0.25 rounded border border-indigo-150/50">
                            {msg.fromRole}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400">{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Message body content */}
                      {editingMessageId === msg._id ? (
                        <div className="space-y-2 mt-1">
                          <textarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingMessageId(null)} className="h-7 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-350 text-[10px] font-bold border-none rounded-lg cursor-pointer">Cancel</button>
                            <button 
                              onClick={async () => {
                                  await editMessage(msg._id, editText);
                                  setEditingMessageId(null);
                                }} 
                                className="h-7 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold border-none rounded-lg cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11.5px] text-slate-600 dark:text-slate-350 font-normal whitespace-pre-wrap leading-relaxed">
                            {msg.body}
                          </p>
                        )}
  
                        {/* Attachments rendering */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="grid gap-1.5 pt-1">
                            {msg.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2.5 p-1.5 border border-slate-200/40 dark:border-slate-800/80 rounded-xl bg-slate-50 dark:bg-slate-900/50 max-w-xs">
                                <Paperclip className="w-5 h-5 text-indigo-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                                  <span className="text-[8px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <a href={file.url} download target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 border-none bg-transparent">
                                  <Download className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Reactions listing */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                            const reactCount = msg.reactions.filter(r => r.emoji === emoji).length;
                            const hasMyReact = msg.reactions.some(r => r.emoji === emoji && r.email.toLowerCase() === profile.email.toLowerCase());
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(msg._id, emoji)}
                                className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer border",
                                  hasMyReact 
                                    ? "bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-800 dark:text-indigo-450" 
                                    : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:border-slate-800"
                                )}
                              >
                                <span>{emoji}</span>
                                <span>{reactCount}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions Hover Bar (Emoji react, Copy, Forward, Edit, Delete) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-1 shrink-0 select-none">
                      <div className="relative flex">
                        <button 
                          onClick={() => setShowEmojiPickerId(showEmojiPickerId === msg._id ? null : msg._id)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 border-none rounded-lg cursor-pointer"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        
                        <AnimatePresence>
                          {showEmojiPickerId === msg._id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute bottom-8 left-0 z-50 flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-full shadow-lg"
                            >
                              {PRESET_EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    toggleReaction(msg._id, emoji);
                                    setShowEmojiPickerId(null);
                                  }}
                                  className="w-7 h-7 hover:scale-125 transition-transform flex items-center justify-center text-xs border-none bg-transparent cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button 
                        onClick={() => handleCopyMessage(msg.body)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 border-none rounded-lg cursor-pointer"
                        title="Copy Text"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setForwardingMessage(msg)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 border-none rounded-lg cursor-pointer"
                        title="Forward"
                      >
                        <CornerUpRight className="w-3.5 h-3.5" />
                      </button>

                      {isMyMessage && (
                        <>
                          <button 
                            onClick={() => { setEditingMessageId(msg._id); setEditText(msg.body); }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 border-none rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteMessage(msg._id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-none rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicators */}
              {activeTypingUsers.length > 0 && (
                <div className="flex items-center gap-1 px-1 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span>{activeTypingUsers.map(u => u.name).join(', ')} typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* MESSAGING COMPOSER BOX */}
            {currentConv && (
              <div className="p-3 pb-5 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-transparent dark:bg-transparent">
                <form onSubmit={handleSendMessage} className="space-y-1.5">
                  
                  {/* File previews */}
                  {selectedAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAttachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-full text-xs font-bold text-slate-650">
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-xs">{file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input area wrapper */}
                  <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex items-start gap-2.5 focus-within:border-indigo-500">
                    <textarea
                      ref={inputRef}
                      value={messageText}
                      onChange={handleInputChange}
                      placeholder={`Message #${currentConv.type === 'channel' ? currentConv.name : getPartnerInfo(currentConv).name}...`}
                      className="flex-1 bg-transparent border-none outline-none resize-none text-xs font-semibold placeholder:text-slate-400 text-slate-800 dark:text-slate-200 min-h-[36px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />

                    {/* Mentions dropdown popup */}
                    {mentionQuery !== null && (
                      <div className="absolute bottom-full left-0 z-50 w-64 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200/20 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">Mention users</p>
                        {employees
                          .filter(e => e.fullName.toLowerCase().includes(mentionQuery) || e.email.toLowerCase().includes(mentionQuery))
                          .map((emp, i) => (
                            <button
                              key={emp.email}
                              type="button"
                              onClick={() => handleSelectMention(emp)}
                              className="w-full text-left px-2 py-1 rounded-lg border-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer flex items-center gap-2"
                            >
                              <img src={emp.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`} className="w-4.5 h-4.5 rounded object-cover" />
                              <div>
                                <p className="leading-none text-slate-800 dark:text-slate-250 font-bold">{emp.fullName}</p>
                                <span className="text-[9px] text-slate-450">{emp.email}</span>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}

                    {/* Actions toolbar */}
                    <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-2.5 self-end">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 cursor-pointer border-none bg-transparent"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="submit"
                        disabled={!messageText.trim() && selectedAttachments.length === 0}
                        className="p-1.5 bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg cursor-pointer border-none shadow-md shadow-indigo-650/15"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. RIGHT PANEL (DETAILS & MEMBERS) */}
      <AnimatePresence>
        {showRightSidebar && currentConv && !globalSearchResults && (
          <>
            {/* Mobile Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[140] md:hidden"
              onClick={() => setShowRightSidebar(false)}
            />
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="fixed md:relative inset-y-0 right-0 z-[150] md:z-0 w-72 md:w-[260px] bg-transparent dark:bg-transparent md:bg-transparent md:dark:bg-transparent border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full min-w-0 shadow-2xl md:shadow-none"
            >
              {/* Header info */}
              <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Details Panel</span>
                <button 
                  onClick={() => setShowRightSidebar(false)}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 cursor-pointer border-none bg-transparent"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 pb-6 space-y-3">
                
                {currentConv.type === 'channel' ? (
                  <>
                    {/* Conv Meta */}
                    <div className="space-y-1 text-center">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-indigo-500 font-extrabold text-sm">
                        #
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-white truncate">
                          #{currentConv.name}
                        </h4>
                        <p className="text-[8px] text-slate-455 truncate mt-0.5">Workspace Channel</p>
                      </div>
                      {currentConv.name !== 'general' && currentConv.name !== 'announcements' && (
                        <div className="flex gap-1 justify-center mt-1">
                          <button
                            onClick={() => {
                              setEditingChannel(currentConv);
                              setEditChannelName(currentConv.name);
                              setEditChannelDesc(currentConv.description || '');
                              setShowEditChannelModal(true);
                            }}
                            className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700 border-none rounded cursor-pointer transition-all"
                          >
                            Edit Settings
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(currentConv._id, currentConv.name)}
                            className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border-none rounded cursor-pointer transition-all"
                          >
                            Delete Channel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-0.5">
                      <h5 className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Info className="w-2.5 h-2.5" /> Description
                      </h5>
                      <p className="text-[10px] text-slate-600 dark:text-slate-355 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 p-1.5 rounded-lg leading-relaxed text-left">
                        {currentConv.description || "No description set for this channel."}
                      </p>
                    </div>

                    {/* MEMBERS DIRECTORY */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center px-1">
                        <h5 className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" /> Members List
                        </h5>
                        <div className="relative">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleInviteMember(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="text-[7px] font-black bg-slate-200 dark:bg-slate-800 dark:text-slate-355 border-none rounded px-1 py-0.5 cursor-pointer max-w-[80px] outline-none"
                          >
                            <option value="">+ Add</option>
                            {employees
                              .filter(e => !currentConv.members?.includes(e.email))
                              .map(e => (
                                <option key={e.email} value={e.email}>{e.fullName}</option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid gap-1">
                        {employees
                          .filter(e => currentConv.members?.includes(e.email) || (currentConv as any).createdBy === e.email)
                          .map((emp) => {
                            const isOnline = onlineUsers.includes(emp.email.toLowerCase()) && emp.chatSettings?.chatPresence !== 'away';
                            const isDnd = emp.chatSettings?.chatDndActive;
                            const statusColor = isOnline ? (isDnd ? "bg-rose-500" : "bg-emerald-500") : "bg-slate-400";
                            return (
                              <div key={emp.email} className="flex items-center gap-2 text-[10px]">
                                <div className="relative shrink-0">
                                  <img src={emp.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`} className="w-4.5 h-4.5 rounded object-cover" />
                                  <span className={cn("absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-slate-950", statusColor)} />
                                </div>
                                <div className="truncate text-left">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-slate-700 dark:text-slate-200 leading-none truncate">{emp.fullName}</p>
                                    {emp.chatSettings?.chatStatusEmoji && (
                                      <span className="text-[9px]" title={emp.chatSettings.chatStatusText}>{emp.chatSettings.chatStatusEmoji}</span>
                                    )}
                                    {isDnd && (
                                      <span className="text-[5.5px] font-black uppercase tracking-wide text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-0.5 py-0.1 rounded border border-rose-150/50 shrink-0">DND</span>
                                    )}
                                  </div>
                                  <span className="text-[7px] text-slate-450 leading-none truncate block mt-0.5">{emp.designation}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                ) : (() => {
                  const partner = getPartnerInfo(currentConv);
                  const matchedEmp = employees.find(e => e.email.toLowerCase() === partner.email.toLowerCase()) || {};
                  const joinedFormatted = matchedEmp.joinedDate 
                    ? new Date(matchedEmp.joinedDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <>
                      {/* Premium Profile Card */}
                      <div className="space-y-2 text-center">
                        <div className="relative inline-block mx-auto group">
                          <img 
                            src={partner.avatar} 
                            alt={partner.name} 
                            className="w-12 h-12 rounded-lg mx-auto object-cover border border-indigo-500/20 shadow-sm transition-all duration-200 hover:scale-105" 
                          />
                          <span className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900",
                            partner.statusColor
                          )} />
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="font-black text-xs text-slate-900 dark:text-white tracking-wide truncate max-w-[200px] mx-auto flex items-center justify-center gap-1">
                            {partner.name}
                            {partner.chatSettings?.chatStatusEmoji && (
                              <span className="text-[10px]" title={partner.chatSettings.chatStatusText}>{partner.chatSettings.chatStatusEmoji}</span>
                            )}
                            {partner.isDnd && (
                              <span className="text-[6px] font-black uppercase tracking-wide text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-0.5 py-0.1 rounded border border-rose-150/50 shrink-0">DND</span>
                            )}
                          </h4>
                          <span className="inline-block px-1.5 py-0.2 text-[7px] font-black bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-150/50 uppercase tracking-wider rounded-full truncate max-w-[180px]">
                            {partner.role}
                          </span>
                          {partner.chatSettings?.chatStatusText && (
                            <p className="text-[8.5px] text-slate-500 italic mt-0.5 px-3 truncate max-w-[200px] mx-auto">
                              "{partner.chatSettings.chatStatusText}"
                            </p>
                          )}
                          {matchedEmp.department && (
                            <p className="text-[8px] text-slate-455 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5 truncate max-w-[180px] mx-auto">
                              {matchedEmp.department}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* About / Bio Box */}
                      <div className="space-y-0.5 text-left">
                        <h5 className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5" /> About
                        </h5>
                        <div className="text-[9.5px] text-slate-650 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 p-2 rounded-lg leading-relaxed italic shadow-sm text-left">
                          "{matchedEmp.bio || 'Senior Specialist'}"
                        </div>
                      </div>

                      {/* Profile Fields List */}
                      <div className="space-y-1.5 bg-white dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800/60 p-2 rounded-lg shadow-sm text-left font-sans">
                        <h5 className="text-[7px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-1 mb-1 flex justify-between items-center">
                          <span>Contact Info</span>
                          <span className={cn("inline-block w-1.5 h-1.5 rounded-full", partner.statusColor)} />
                        </h5>

                        {/* Presence Status */}
                        <div className="flex items-start gap-1.5 text-xs min-w-0">
                          <div className={cn("w-2.5 h-2.5 rounded-full border border-white dark:border-slate-950 shrink-0 mt-0.5", partner.statusColor)} />
                          <div className="min-w-0 flex-1">
                            <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Presence Status</span>
                            <span className="text-[8.5px] font-bold text-slate-700 dark:text-slate-200 block">
                              {partner.isOnline ? (partner.isDnd ? "Do Not Disturb" : "Active / Online") : "Away / Offline"}
                            </span>
                          </div>
                        </div>
                        
                        {/* Email */}
                        <div className="flex items-start gap-1.5 text-xs min-w-0">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</span>
                            <a href={`mailto:${partner.email}`} className="text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline break-all block">
                              {partner.email}
                            </a>
                          </div>
                        </div>

                        {/* Phone */}
                        {matchedEmp.phone && (
                          <div className="flex items-start gap-1.5 text-xs min-w-0">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[7px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">Phone Number</span>
                              <a href={`tel:${matchedEmp.phone}`} className="text-[8.5px] font-bold text-slate-700 dark:text-slate-200 hover:underline block">
                                {matchedEmp.phone}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Location */}
                        {matchedEmp.location && (
                          <div className="flex items-start gap-1.5 text-xs min-w-0">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[7px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">Office Location</span>
                              <span className="text-[8.5px] font-bold text-slate-700 dark:text-slate-200 block">
                                {matchedEmp.location}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Joined Date */}
                        {matchedEmp.joinedDate && (
                          <div className="flex items-start gap-1.5 text-xs min-w-0">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[7px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">Joined Date</span>
                              <span className="text-[8.5px] font-bold text-slate-700 dark:text-slate-200 block">
                                {joinedFormatted}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* SHARED FILES */}
                <div className="space-y-1">
                  <h5 className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <FolderOpen className="w-2.5 h-2.5" /> Shared Files
                  </h5>
                  <div className="grid gap-1">
                    {getSharedFiles().length > 0 ? (
                      getSharedFiles().map((file, idx) => (
                        <div key={idx} className="p-1 border border-slate-150 dark:border-slate-800/60 bg-white dark:bg-slate-900 rounded-md flex items-center justify-between text-[9.5px] min-w-0">
                          <div className="truncate min-w-0 mr-2 text-left">
                            <p className="font-bold text-slate-700 dark:text-slate-250 truncate leading-none mb-0.5">{file.name}</p>
                            <span className="text-[7px] text-slate-400 leading-none">By: {file.senderName}</span>
                          </div>
                          <a href={file.url} download target="_blank" rel="noreferrer" className="p-0.5 hover:bg-slate-100 rounded text-indigo-500 border-none bg-transparent">
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-[8px] text-slate-400 italic pl-1 text-left">No shared files in this chat.</p>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {typeof document !== 'undefined' && createPortal(
        <>
          {/* CREATE CHANNEL MODAL */}
          <AnimatePresence>
            {showChannelModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowChannelModal(false)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Create Channel</h3>
                    <button onClick={() => setShowChannelModal(false)} className="p-1 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateChannel} className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Channel Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. engineering"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Description</label>
                      <input 
                        type="text" 
                        placeholder="Brief description of the channel goals"
                        value={channelDesc}
                        onChange={(e) => setChannelDesc(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">Private Channel</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Only invited members can view the conversation</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={channelPrivate}
                        onChange={(e) => setChannelPrivate(e.target.checked)}
                        className="w-4 h-4 accent-indigo-650 cursor-pointer"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full h-10 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none shadow-md shadow-indigo-650/15 cursor-pointer"
                    >
                      Create
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* EDIT CHANNEL MODAL */}
          <AnimatePresence>
            {showEditChannelModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { setShowEditChannelModal(false); setEditingChannel(null); }}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Edit Channel Settings</h3>
                    <button onClick={() => { setShowEditChannelModal(false); setEditingChannel(null); }} className="p-1 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleEditChannel} className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Channel Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. engineering"
                        value={editChannelName}
                        onChange={(e) => setEditChannelName(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Description</label>
                      <input 
                        type="text" 
                        placeholder="Brief description of the channel goals"
                        value={editChannelDesc}
                        onChange={(e) => setEditChannelDesc(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none text-xs"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full h-10 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none shadow-md shadow-indigo-650/15 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* DELETE CONFIRM MODAL */}
          <AnimatePresence>
            {deleteConfirm && (
              <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isDeleting && setDeleteConfirm(null)}
                  className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="relative w-full max-w-sm"
                >
                  {/* Card */}
                  <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border border-red-100 dark:border-red-500/20 rounded-[24px] p-8 text-center shadow-2xl dark:shadow-slate-950/50">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/30 flex items-center justify-center mx-auto mb-5 shadow-inner">
                      <Trash2 className="w-7 h-7 text-red-500 dark:text-red-400" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 mb-2 tracking-tight">
                      Delete Channel?
                    </h3>

                    {/* Message */}
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed font-medium">
                      You are about to permanently delete
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-500/10 border border-red-100/60 dark:border-red-500/25 rounded-xl mb-3 shadow-sm">
                      <span className="text-xs font-bold text-red-650 dark:text-red-400">#{deleteConfirm.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-550 mb-7 leading-normal">
                      All messages in this channel will be lost forever.
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        disabled={isDeleting}
                        className="flex-1 h-[42px] rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteChannel}
                        disabled={isDeleting}
                        className="flex-1 h-[42px] rounded-xl border-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all duration-200 shadow-md shadow-red-500/25 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {isDeleting ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>🗑️ Delete Forever</>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* FORWARD MESSAGE MODAL */}
          <AnimatePresence>
            {forwardingMessage && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setForwardingMessage(null)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Forward Message</h3>
                    <button onClick={() => setForwardingMessage(null)} className="p-1 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Message preview */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 text-left">Message Preview</p>
                    <p className="text-xs text-slate-700 dark:text-slate-350 text-left leading-relaxed truncate max-h-12">
                      {forwardingMessage.body}
                    </p>
                  </div>

                  {/* Search target */}
                  <div className="space-y-2 text-left">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search channel or colleague..."
                        value={forwardSearch}
                        onChange={(e) => setForwardSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none text-xs"
                      />
                    </div>

                    {/* Recipient list */}
                    <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
                      {conversations
                        .filter(c => {
                          if (!forwardSearch.trim()) return true;
                          if (c.type === 'channel') {
                            return c.name.toLowerCase().includes(forwardSearch.toLowerCase());
                          } else {
                            const partner = getPartnerInfo(c);
                            return partner.name.toLowerCase().includes(forwardSearch.toLowerCase()) || partner.email.toLowerCase().includes(forwardSearch.toLowerCase());
                          }
                        })
                        .map(conv => {
                          const isChannel = conv.type === 'channel';
                          const name = isChannel ? `#${conv.name}` : getPartnerInfo(conv).name;
                          const subtitle = isChannel ? (conv.description || 'Channel') : getPartnerInfo(conv).role;
                          
                          return (
                            <div key={conv._id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                              <div className="flex items-center gap-2.5 truncate">
                                {isChannel ? (
                                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 shrink-0">
                                    {conv.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                  </div>
                                ) : (
                                  <img src={getPartnerInfo(conv).avatar} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                                )}
                                <div className="text-left truncate">
                                  <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate leading-none">{name}</p>
                                  <span className="text-[10px] text-slate-450 mt-1 truncate block">{subtitle}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleForwardMessage(conv)}
                                className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider border-none rounded-xl cursor-pointer active:scale-95 transition-all"
                              >
                                Forward
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* SETTINGS / PROFILE MODAL */}
          <AnimatePresence>
            {showSettingsModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSettingsModal(false)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-indigo-500" />
                      Workplace Chat Settings
                    </h3>
                    <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-3 text-left">
                    {/* 1. Profile Picture Section */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Profile Picture</span>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {userProfile?.profilePicture ? (
                            <img 
                              src={userProfile?.profilePicture} 
                              alt="Profile Picture" 
                              className="w-12 h-12 rounded-xl object-cover" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-650 text-xl">
                              {profile.name ? profile.name[0] : 'E'}
                            </div>
                          )}
                          {uploadingAvatar && (
                            <div className="absolute inset-0 bg-slate-950/50 rounded-xl flex items-center justify-center">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <input 
                            type="file"
                            id="chat-profile-photo-upload"
                            accept="image/*"
                            onChange={handleProfilePhotoUpload}
                            className="hidden"
                          />
                          <div className="flex gap-1.5">
                            <label 
                              htmlFor="chat-profile-photo-upload"
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-indigo-650/15"
                            >
                              <Upload className="w-3 h-3" />
                              Upload New Photo
                            </label>
                            {userProfile?.profilePicture && (
                              <button
                                type="button"
                                onClick={handleDeleteProfilePhoto}
                                className="px-2 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-500 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            )}
                          </div>
                          <p className="text-[8px] text-slate-400 font-medium">Supports JPG, PNG or GIF. Max size 2MB.</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Chat Display Name */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Chat Display Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. raj.patil"
                        value={chatDisplayName}
                        onChange={e => setChatDisplayName(e.target.value)}
                        className="w-full h-8.5 px-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg outline-none text-xs text-slate-850 dark:text-slate-200"
                      />
                      <p className="text-[8px] text-slate-400 font-medium">Your display name for direct messages and channels.</p>
                    </div>

                    {/* 3. Availability Presence */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Presence Status</label>
                      <select
                        value={chatPresence}
                        onChange={e => setChatPresence(e.target.value)}
                        className="w-full h-8.5 px-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg outline-none text-xs cursor-pointer font-bold text-slate-800 dark:text-slate-200"
                      >
                        <option value="online">🟢 Active / Online</option>
                        <option value="away">⚪ Away / Offline</option>
                      </select>
                    </div>

                    {/* 4. Current Status Emoji & Text */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Current Status Message</label>
                      <div className="flex gap-1.5">
                        <select
                          value={chatStatusEmoji}
                          onChange={e => setChatStatusEmoji(e.target.value)}
                          className="w-12 h-8.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-center text-sm outline-none cursor-pointer text-slate-800 dark:text-slate-250"
                        >
                          <option value="">💬</option>
                          <option value="💻">💻</option>
                          <option value="🗓️">🗓️</option>
                          <option value="🚗">🚗</option>
                          <option value="🤒">🤒</option>
                          <option value="🏠">🏠</option>
                          <option value="🌴">🌴</option>
                        </select>
                        <input 
                          type="text"
                          placeholder="e.g. Working remotely, Out sick, Focusing"
                          value={chatStatusText}
                          onChange={e => setChatStatusText(e.target.value)}
                          className="flex-1 h-8.5 px-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg outline-none text-xs text-slate-850 dark:text-slate-200"
                        />
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { emoji: '💻', text: 'Focusing / Working' },
                          { emoji: '🗓️', text: 'In a meeting' },
                          { emoji: '🚗', text: 'Commuting' },
                          { emoji: '🤒', text: 'Out sick' },
                          { emoji: '🏠', text: 'Working remotely' }
                        ].map(opt => (
                          <button
                            type="button"
                            key={opt.text}
                            onClick={() => { setChatStatusEmoji(opt.emoji); setChatStatusText(opt.text); }}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-[8px] font-bold text-slate-500 cursor-pointer"
                          >
                            {opt.emoji} {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. Mute Alerts / DND Switches */}
                    <div className="flex justify-between items-center p-2.5 border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">Mute Sound Alerts</h4>
                        <p className="text-[9px] text-slate-455 mt-0.5">Mute chimes for incoming messages</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={chatMuteSound}
                        onChange={(e) => setChatMuteSound(e.target.checked)}
                        className="w-3.5 h-3.5 accent-indigo-650 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-center p-2.5 border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250">Do Not Disturb (DND)</h4>
                        <p className="text-[9px] text-slate-455 mt-0.5">Snooze all incoming chat push alerts</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={chatDndActive}
                        onChange={(e) => setChatDndActive(e.target.checked)}
                        className="w-3.5 h-3.5 accent-indigo-650 cursor-pointer"
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="w-full h-8.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider border-none shadow-md shadow-indigo-650/15 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {savingSettings ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* EDIT WORKSPACE NAME MODAL */}
          <AnimatePresence>
            {showWorkspaceNameModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowWorkspaceNameModal(false)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Edit Company Name</h3>
                    <button onClick={() => setShowWorkspaceNameModal(false)} className="p-1 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Company / Workspace Name</label>
                      <input 
                        type="text" 
                        value={workspaceNameInput}
                        onChange={(e) => setWorkspaceNameInput(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none text-xs text-slate-850 dark:text-slate-200 font-semibold"
                        placeholder="Enter company name..."
                        required
                      />
                    </div>

                    <button 
                      onClick={async () => {
                        if (!workspaceNameInput.trim()) return;
                        const token = localStorage.getItem('hr_system_token');
                        try {
                          const res = await fetch('/api/settings/system', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({
                              chat: {
                                workspaceName: workspaceNameInput
                              }
                            })
                          });
                          if (res.ok) {
                            setSystemWorkspaceName(workspaceNameInput);
                            setShowWorkspaceNameModal(false);
                            addNotification("Company name updated successfully!");
                          } else {
                            alert("Failed to update company name.");
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Error updating company name.");
                        }
                      }}
                      className="w-full h-10 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none shadow-md shadow-indigo-650/15 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
}
