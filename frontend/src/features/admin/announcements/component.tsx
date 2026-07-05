"use client";

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Filter, Calendar, User, 
  CheckCircle, AlertCircle, Bookmark, Sparkles, Loader2, RefreshCw,
  Users, CheckSquare, X, ChevronRight, Image, FileText, MapPin, Trash2, CheckCircle2, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { usePermission } from '@/context/PermissionContext';

interface IAnnouncement {
  _id?: string;
  title: string;
  content: string;
  category: string; // 'Urgent' | 'General' | 'Event' | 'Policy'
  postedBy: string;
  createdAt: Date | string;
  
  // Event specific fields
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventType?: string;
  eventBanner?: string;
  maxParticipants?: number;
  rsvpRequired?: boolean;
  isCompleted?: boolean;
  eventPhotos?: string[];
  eventSummary?: string;

  // Audience Target Fields
  audienceType?: string;
  targetEmployees?: string[];
}

export function AnnouncementsPage({ userRole = 'HR' }: { userRole?: string }) {
  const [mounted, setMounted] = useState(false);
  // ── RBAC Permission checks ────────────────────────────────────────────────
  const { can } = usePermission();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Selected Event Details Modal / Management States
  const [selectedAnn, setSelectedAnn] = useState<IAnnouncement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [rsvpSummary, setRsvpSummary] = useState<any>(null);
  const [summaryText, setSummaryText] = useState('');
  const [eventPhotos, setEventPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [annToDelete, setAnnToDelete] = useState<string | null>(null);

  const [newAnn, setNewAnn] = useState({
    title: '',
    content: '',
    category: 'General',
    postedBy: 'HR Management Team',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    eventType: 'Townhall',
    eventBanner: '',
    maxParticipants: '',
    rsvpRequired: false,
    audienceType: 'All',
    targetEmployees: [] as string[]
  });

  const [empSearch, setEmpSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/announcements', { headers });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/employees', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchEmployees();
  }, []);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const payload: any = {
        title: newAnn.title,
        content: newAnn.content,
        category: newAnn.category,
        postedBy: newAnn.postedBy,
        audienceType: newAnn.audienceType,
        targetEmployees: newAnn.audienceType === 'Specific' ? newAnn.targetEmployees : []
      };

      if (newAnn.category === 'Event') {
        payload.eventDate = newAnn.eventDate ? new Date(newAnn.eventDate) : undefined;
        payload.eventTime = newAnn.eventTime;
        payload.eventLocation = newAnn.eventLocation;
        payload.eventType = newAnn.eventType;
        payload.eventBanner = newAnn.eventBanner || undefined;
        payload.maxParticipants = newAnn.maxParticipants ? Number(newAnn.maxParticipants) : undefined;
        payload.rsvpRequired = newAnn.rsvpRequired;
      }

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewAnn({
          title: '',
          content: '',
          category: 'General',
          postedBy: 'HR Management Team',
          eventDate: '',
          eventTime: '',
          eventLocation: '',
          eventType: 'Townhall',
          eventBanner: '',
          maxParticipants: '',
          rsvpRequired: false,
          audienceType: 'All',
          targetEmployees: []
        });
        setEmpSearch('');
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnToDelete(id);
  };

  const confirmDeleteAnnouncement = async () => {
    if (!annToDelete) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/announcements/${annToDelete}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setShowDetailsModal(false);
        fetchAnnouncements();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnnToDelete(null);
    }
  };

  const handleOpenDetails = async (ann: IAnnouncement) => {
    setSelectedAnn(ann);
    setShowDetailsModal(true);
    setSummaryText(ann.eventSummary || '');
    setEventPhotos(ann.eventPhotos || []);
    setRsvpSummary(null);
    setParticipants([]);
    
    if (ann.category === 'Event') {
      setIsDetailLoading(true);
      try {
        const token = localStorage.getItem('hr_system_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/announcements/${ann._id}/rsvp`, { headers });
        if (res.ok) {
          const data = await res.json();
          setRsvpSummary(data.summary);
          setParticipants(data.participants || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsDetailLoading(false);
      }
    }
  };

  const handleEventPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('hr_system_token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      setEventPhotos(prev => [...prev, result.url]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCompleteEvent = async () => {
    if (!selectedAnn) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/announcements/${selectedAnn._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isCompleted: true,
          eventPhotos,
          eventSummary: summaryText
        })
      });

      if (res.ok) {
        setShowDetailsModal(false);
        fetchAnnouncements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'All' || a.category === catFilter;
    return matchesSearch && matchesCat;
  });

  // Use dynamic RBAC permission — works for all roles including Employee with announcement.create granted
  const canPublish = can('announcement.create') || userRole === 'Admin' || userRole === 'Super Admin';

  // Dashboard Stats Calculations
  const upcomingEventsCount = announcements.filter(a => a.category === 'Event' && a.eventDate && new Date(a.eventDate) > new Date() && !a.isCompleted).length;
  const todaysEventsCount = announcements.filter(a => a.category === 'Event' && a.eventDate && new Date(a.eventDate).toDateString() === new Date().toDateString()).length;
  const completedEventsCount = announcements.filter(a => a.category === 'Event' && a.isCompleted).length;

  return (
    <div className="p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-blue-500 animate-pulse shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase font-outfit">Corporate Communications & Events</h1>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            Broadcast global announcements or schedule, monitor and summary-track active employee corporate events.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={fetchAnnouncements}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          {canPublish && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="saas-btn-primary cursor-pointer flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4" /> Create Broadcast
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Stats Widgets Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming Events', value: upcomingEventsCount, icon: Calendar, accent: '#3B82F6', sub: 'Scheduled activities' },
          { label: "Today's Events", value: todaysEventsCount, icon: Clock, accent: '#F59E0B', sub: 'Due today' },
          { label: 'Completed Events', value: completedEventsCount, icon: CheckCircle2, accent: '#10B981', sub: 'Resolved/ended items' },
          { label: 'Target Pool', value: `${employees.length} Users`, icon: Users, accent: '#8B5CF6', sub: 'Active personnel directory' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1 w-full md:max-w-md">
          <input 
            type="text" 
            placeholder="Search broadcasts, location, key terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="saas-input w-full pr-4 py-2 text-xs"
          />
        </div>

        <div className="premium-nav-container">
          {['All', 'Urgent', 'General', 'Policy', 'Event'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                catFilter === cat ? "premium-nav-item-active" : ""
              )}
            >
              <span>{cat === 'Event' ? 'Events' : cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Broadcast Listings */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Bulletins...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="saas-card py-20 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <Megaphone className="w-12 h-12 text-slate-350 dark:text-slate-700 mb-4" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-2 px-6">
            There are no broadcasts or events matching the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAnnouncements.map((ann, idx) => {
            const isEv = ann.category === 'Event';
            const comp = ann.isCompleted;

            return (
              <motion.div
                key={ann._id || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => handleOpenDetails(ann)}
                className="bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-850 rounded-3xl flex flex-col justify-between shadow-sm hover:shadow-md hover:shadow-indigo-500/5 hover:scale-[1.01] active:scale-[0.995] transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                {ann.category === 'Urgent' && (
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse z-20" />
                )}

                {isEv && ann.eventBanner && (
                  <div className="h-28 w-full relative overflow-hidden shrink-0">
                    <img 
                      src={ann.eventBanner} 
                      alt="Banner" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    
                    <span className={cn(
                      "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border z-10",
                      comp 
                        ? "bg-slate-900 border-slate-750 text-slate-400" 
                        : "bg-emerald-950/90 border-emerald-500/30 text-emerald-400"
                    )}>
                      {comp ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                )}

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${
                          ann.category === 'Urgent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          ann.category === 'Policy' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          ann.category === 'Event' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                          'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {ann.category === 'Event' ? ann.eventType || 'Event' : ann.category}
                        </span>

                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border",
                          ann.audienceType === 'Specific'
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-slate-100 dark:bg-slate-805 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60"
                        )}>
                          {ann.audienceType === 'Specific' ? 'Targeted' : 'Public'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>{new Date(ann.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    </div>

                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit">
                      {ann.title}
                    </h3>
                    
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>

                    {isEv && (
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-450 border-t border-slate-150/40 dark:border-slate-850 pt-2.5 mt-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{ann.eventDate ? new Date(ann.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{ann.eventTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{ann.eventLocation}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-150/40 dark:border-slate-850 pt-2.5 flex justify-between items-center text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ann.postedBy}</span>
                    </span>
                    
                    <span className="text-blue-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Manage {isEv ? 'Event' : 'Ann'} <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase font-outfit mb-4">Publish Global Broadcast</h2>
              
              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bulletin Title *</label>
                  <input 
                    type="text" 
                    required 
                    value={newAnn.title}
                    onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                    className="saas-input w-full px-3 py-2.5 text-xs" 
                    placeholder="e.g., Annual Hackathon / Q3 Policy Updates..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Category</label>
                    <select 
                      value={newAnn.category}
                      onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                      className="saas-input w-full px-3 py-2.5 text-xs cursor-pointer"
                    >
                      <option value="General">General Broadcast</option>
                      <option value="Urgent">Urgent Alert</option>
                      <option value="Policy">Policy Update</option>
                      <option value="Event">Townhall / Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Publisher Identity *</label>
                    <input 
                      type="text" 
                      required 
                      value={newAnn.postedBy}
                      onChange={(e) => setNewAnn({ ...newAnn, postedBy: e.target.value })}
                      className="saas-input w-full px-3 py-2.5 text-xs" 
                      placeholder="e.g., HR Management Team"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Audience Targeting</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                      <input 
                        type="radio" 
                        name="audienceType"
                        value="All"
                        checked={newAnn.audienceType === 'All'}
                        onChange={() => setNewAnn({ ...newAnn, audienceType: 'All', targetEmployees: [] })}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                      />
                      All Employees
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                      <input 
                        type="radio" 
                        name="audienceType"
                        value="Specific"
                        checked={newAnn.audienceType === 'Specific'}
                        onChange={() => setNewAnn({ ...newAnn, audienceType: 'Specific' })}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                      />
                      Specific Employees
                    </label>
                  </div>

                  {newAnn.audienceType === 'Specific' && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-150/70 dark:border-slate-805 space-y-3">
                      <div className="relative">
                        <div className="flex items-center relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                          <input 
                            type="text"
                            placeholder="Type employee name or email to search..."
                            value={empSearch}
                            onChange={(e) => setEmpSearch(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            className="saas-input w-full pl-8 pr-3 py-2 text-xs"
                          />
                        </div>
                        
                        {isSearchFocused && (
                          <div className="absolute z-[10000] left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg no-scrollbar">
                            {employees
                              .filter(emp => {
                                const name = emp.fullName || emp.name || '';
                                const email = emp.email || '';
                                const matchesSearch = !empSearch.trim() || 
                                                      name.toLowerCase().includes(empSearch.toLowerCase()) || 
                                                      email.toLowerCase().includes(empSearch.toLowerCase());
                                const notSelected = !newAnn.targetEmployees.includes(email);
                                return matchesSearch && notSelected;
                              })
                              .map((emp, idx) => {
                                const name = emp.fullName || emp.name || '';
                                const email = emp.email || '';
                                return (
                                  <div 
                                    key={emp._id || emp.id || email || idx}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setNewAnn(prev => ({
                                        ...prev,
                                        targetEmployees: [...prev.targetEmployees, email]
                                      }));
                                      setEmpSearch('');
                                      setIsSearchFocused(false);
                                    }}
                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs flex justify-between items-center text-slate-700 dark:text-slate-200"
                                  >
                                    <span className="font-bold">{name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{email}</span>
                                  </div>
                                );
                              })}
                            {employees.filter(emp => {
                              const name = emp.fullName || emp.name || '';
                              const email = emp.email || '';
                              const matchesSearch = !empSearch.trim() || 
                                                    name.toLowerCase().includes(empSearch.toLowerCase()) || 
                                                    email.toLowerCase().includes(empSearch.toLowerCase());
                              const notSelected = !newAnn.targetEmployees.includes(email);
                              return matchesSearch && notSelected;
                            }).length === 0 && (
                              <div className="p-3 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {employees.length === 0 ? "Loading/No Employees" : "No matching employees"}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {newAnn.targetEmployees.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar pt-1">
                          {newAnn.targetEmployees.map(email => {
                            const emp = employees.find(e => e.email === email);
                            const displayName = emp ? (emp.fullName || emp.name) : email;
                            return (
                              <div 
                                key={email}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold"
                              >
                                <span>{displayName}</span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setNewAnn(prev => ({
                                      ...prev,
                                      targetEmployees: prev.targetEmployees.filter(e => e !== email)
                                    }));
                                  }}
                                  className="hover:text-rose-500 transition-colors border-none bg-transparent cursor-pointer p-0 shrink-0"
                                >
                                  <X className="w-3 h-3 text-slate-505 hover:text-rose-500" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider">No employees selected. Standard employees won't see this bulletin unless selected.</p>
                      )}
                    </div>
                  )}
                </div>

                {newAnn.category === 'Event' && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150/70 dark:border-slate-800 space-y-4">
                    <p className="text-[9px] font-black uppercase text-blue-500 tracking-wider">Event Scheduling Parameters</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Event Date *</label>
                        <input 
                          type="date" 
                          required={newAnn.category === 'Event'}
                          value={newAnn.eventDate}
                          onChange={(e) => setNewAnn({ ...newAnn, eventDate: e.target.value })}
                          className="saas-input w-full px-3 py-2 text-xs" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Event Time *</label>
                        <input 
                          type="text" 
                          required={newAnn.category === 'Event'}
                          placeholder="e.g., 2:00 PM - 3:00 PM"
                          value={newAnn.eventTime}
                          onChange={(e) => setNewAnn({ ...newAnn, eventTime: e.target.value })}
                          className="saas-input w-full px-3 py-2 text-xs" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Location / Remote Link *</label>
                        <input 
                          type="text" 
                          required={newAnn.category === 'Event'}
                          placeholder="Conference Room / Teams Link"
                          value={newAnn.eventLocation}
                          onChange={(e) => setNewAnn({ ...newAnn, eventLocation: e.target.value })}
                          className="saas-input w-full px-3 py-2 text-xs" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Event Type</label>
                        <select 
                          value={newAnn.eventType}
                          onChange={(e) => setNewAnn({ ...newAnn, eventType: e.target.value })}
                          className="saas-input w-full px-3 py-2 text-xs cursor-pointer"
                        >
                          <option value="Townhall">Townhall</option>
                          <option value="Training">Training</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Webinar">Webinar</option>
                          <option value="Birthday Celebration">Birthday Celebration</option>
                          <option value="Festival Celebration">Festival Celebration</option>
                          <option value="Team Outing">Team Outing</option>
                          <option value="Sports Event">Sports Event</option>
                          <option value="Annual Meeting">Annual Meeting</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Maximum Participants</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 50 (blank for unlimited)"
                          value={newAnn.maxParticipants}
                          onChange={(e) => setNewAnn({ ...newAnn, maxParticipants: e.target.value })}
                          className="saas-input w-full px-3 py-2 text-xs" 
                        />
                      </div>

                      <div className="flex items-center justify-between pt-5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RSVP Required</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newAnn.rsvpRequired}
                            onChange={(e) => setNewAnn({ ...newAnn, rsvpRequired: e.target.checked })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Event Banner Image URL</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={newAnn.eventBanner}
                          onChange={(e) => setNewAnn({ ...newAnn, eventBanner: e.target.value })}
                          className="saas-input w-full px-3 py-2 text-xs" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const type = newAnn.eventType;
                            let url = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';
                            if (type === 'Birthday Celebration') url = 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=60';
                            else if (type === 'Team Outing') url = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60';
                            else if (type === 'Webinar' || type === 'Training' || type === 'Workshop') url = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60';
                            else if (type === 'Festival Celebration') url = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60';
                            else if (type === 'Sports Event') url = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60';
                            else if (type === 'Annual Meeting') url = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=60';
                            
                            setNewAnn({ ...newAnn, eventBanner: url });
                          }}
                          className="px-3 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border border-slate-200/50 dark:border-slate-700"
                        >
                          Auto Preset
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bulletin Content *</label>
                  <textarea 
                    required 
                    value={newAnn.content}
                    onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                    className="saas-input w-full px-3 py-2 text-xs h-24" 
                    placeholder="Provide description, agenda or core details of this bulletin..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="saas-btn-primary cursor-pointer text-[9px]"
                  >
                    Publish Broadcast
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details & Event Management Modal Drawer */}
      <AnimatePresence>
        {showDetailsModal && selectedAnn && (
          <div key="details-modal" className="fixed inset-0 z-[9999] bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              {/* Modal header/banner */}
              {selectedAnn.category === 'Event' && selectedAnn.eventBanner ? (
                <div className="h-44 w-full relative shrink-0">
                  <img src={selectedAnn.eventBanner} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full border border-slate-750 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-4 left-6 text-white">
                    <span className="px-2 py-0.5 bg-blue-600 text-[8px] font-black uppercase rounded-lg tracking-widest">{selectedAnn.eventType || 'Event'}</span>
                    <h2 className="text-lg font-black uppercase tracking-tight mt-2 font-outfit">{selectedAnn.title}</h2>
                  </div>
                </div>
              ) : (
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                  <div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-black uppercase rounded-lg text-slate-500 dark:text-slate-400 tracking-widest">{selectedAnn.category} Broadcast</span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 font-outfit">{selectedAnn.title}</h2>
                  </div>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {/* Modal scroll body */}
              <div className="p-6 overflow-y-auto no-scrollbar flex-1 space-y-6">
                
                {/* Event Scheduler details panel */}
                {selectedAnn.category === 'Event' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl text-xs">
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Date</p>
                      <p className="text-slate-700 dark:text-slate-200 font-bold mt-1">
                        {selectedAnn.eventDate ? new Date(selectedAnn.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Time</p>
                      <p className="text-slate-700 dark:text-slate-200 font-bold mt-1">{selectedAnn.eventTime}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Location / URL</p>
                      <p className="text-slate-700 dark:text-slate-200 font-bold mt-1 truncate">{selectedAnn.eventLocation}</p>
                    </div>
                  </div>
                )}

                 {/* Announcement Context */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Broadcast Content</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-850/60">
                    {selectedAnn.content}
                  </p>
                </div>

                {/* Audience Target details panel */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl text-xs space-y-2">
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Audience Target</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {selectedAnn.audienceType === 'Specific' ? 'Specific Employees Only' : 'All Employees'}
                    </span>
                  </div>
                  {selectedAnn.audienceType === 'Specific' && selectedAnn.targetEmployees && selectedAnn.targetEmployees.length > 0 && (
                    <div className="pt-2 border-t border-slate-150 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Targeted List ({selectedAnn.targetEmployees.length})</p>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
                        {selectedAnn.targetEmployees.map((email, i) => (
                          <span key={`${email}-${i}`} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-md text-[9px] font-semibold">{email}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RSVP participants metrics (Event Only) */}
                {selectedAnn.category === 'Event' && selectedAnn.rsvpRequired && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">RSVP & Participant Tracking</h4>
                    
                    {isDetailLoading ? (
                      <div className="flex justify-center items-center py-6 gap-2">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing participants...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Widgets summary metrics */}
                        {rsvpSummary && (
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                              <p className="text-emerald-500 text-[9px] font-black uppercase tracking-wider">Going</p>
                              <p className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none">
                                {rsvpSummary.going}
                                {selectedAnn.maxParticipants ? <span className="text-[10px] text-slate-400 font-normal">/{selectedAnn.maxParticipants}</span> : null}
                              </p>
                            </div>
                            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                              <p className="text-amber-500 text-[9px] font-black uppercase tracking-wider">Maybe</p>
                              <p className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none">{rsvpSummary.maybe}</p>
                            </div>
                            <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                              <p className="text-rose-500 text-[9px] font-black uppercase tracking-wider">Declined</p>
                              <p className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none">{rsvpSummary.notAttending}</p>
                            </div>
                          </div>
                        )}

                        {/* Attendee Name Table */}
                        <div className="border border-slate-105 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/20 max-h-48 overflow-y-auto no-scrollbar">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-150/70 dark:border-slate-800">
                                <th className="p-3 text-left">Employee Name</th>
                                <th className="p-3 text-left">Email Address</th>
                                <th className="p-3 text-right">RSVP Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {participants.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">No RSVPs registered.</td>
                                </tr>
                              ) : (
                                participants.map((p, pIdx) => (
                                  <tr key={p._id || p.employeeEmail || pIdx} className="border-b border-slate-100 dark:border-slate-850/50 hover:bg-slate-100/30 dark:hover:bg-slate-950/30">
                                    <td className="p-3 text-slate-700 dark:text-slate-200 font-bold">{p.employeeName}</td>
                                    <td className="p-3 text-slate-450 truncate">{p.employeeEmail}</td>
                                    <td className="p-3 text-right">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border tracking-wider",
                                        p.status === 'Going' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                        p.status === 'Maybe' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                        "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                      )}>
                                        {p.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Event Completion, summary, photo gallery features (Event Only) */}
                {selectedAnn.category === 'Event' && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 text-xs">
                    <p className="text-[9px] font-black uppercase text-blue-500 tracking-wider">Post-Event Summary & Media</p>
                    
                    <div>
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-1.5">Publish Event Summary (Mark completed)</span>
                      <textarea
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        placeholder="Write a recap or key takeaways from the event..."
                        className="saas-input w-full p-2.5 text-xs h-20"
                      />
                    </div>

                    <div>
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-2">Event Gallery Photos</span>
                      
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {eventPhotos.map((photo, i) => (
                          <div key={`photo-${i}`} className="h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group">
                            <img src={photo} alt="Gallery" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setEventPhotos(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 p-0.5 bg-slate-950/80 hover:bg-rose-600 rounded-md text-white border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <div className="relative">
                          <input
                            type="file"
                            id="event-photo-upload"
                            accept="image/*"
                            onChange={handleEventPhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isUploadingPhoto}
                            onClick={() => document.getElementById('event-photo-upload')?.click()}
                            className="w-full h-16 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 cursor-pointer"
                          >
                            {isUploadingPhoto ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span className="text-[8px] font-bold mt-1">Upload Image</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {!selectedAnn.isCompleted && (
                      <button
                        onClick={handleCompleteEvent}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-4 h-4" /> Save & Mark Event Completed
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer actions */}
              <div className="p-4 bg-slate-100 dark:bg-slate-900/60 border-t border-slate-150/70 dark:border-slate-800/80 flex justify-between items-center shrink-0">
                <button
                  onClick={() => handleDeleteAnnouncement(selectedAnn._id!)}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-rose-500/20 active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Bulletin
                </button>
                
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none"
                >
                  Close Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {annToDelete && (
          <div key="delete-confirm" className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
              onClick={() => setAnnToDelete(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 relative z-10 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-outfit">Delete Confirmation</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[10.5px] leading-relaxed">
                    Are you sure you want to delete this event/announcement? This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAnnToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAnnouncement}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none shadow-md shadow-rose-600/15"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
