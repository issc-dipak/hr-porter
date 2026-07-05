import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Mail, CheckCircle2, AlertCircle, Calendar, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmailLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailLogModal = ({ isOpen, onClose }: EmailLogModalProps) => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/emails', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && mounted) {
      fetchEmails();
    }
  }, [isOpen, mounted]);

  const filteredEmails = emails.filter(email => {
    const query = searchQuery.toLowerCase();
    return (
      (email.to || '').toLowerCase().includes(query) ||
      (email.subject || '').toLowerCase().includes(query) ||
      (email.text || '').toLowerCase().includes(query)
    );
  });

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto z-[9999] flex items-stretch sm:items-center p-0 sm:p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-sm pointer-events-auto"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)' }}
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="relative w-full h-full sm:max-w-sm sm:h-[calc(100vh-32px)] bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md rounded-none sm:rounded-[24px] shadow-2xl border-none sm:border sm:border-slate-800/80 p-4 flex flex-col overflow-hidden text-left pointer-events-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/10 dark:bg-blue-500/5 rounded-xl flex items-center justify-center text-blue-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-white">Email Logs</h2>
                  <p className="text-slate-400 text-[8px] font-bold uppercase tracking-wider mt-0.5">Real-time sync of system emails</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={fetchEmails}
                  className="p-1.5 bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-blue-550/15 transition-all cursor-pointer border-none"
                  title="Refresh Email Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/15 transition-all cursor-pointer border-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="py-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search emails..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-955/60 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                />
              </div>
            </div>

            {/* List and View Container */}
            <div className="flex-1 min-h-0 flex flex-col py-1">
              {!selectedEmailId ? (
                /* Mail list view */
                <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col bg-slate-950/20 border border-slate-800 rounded-lg">
                  {loading && emails.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Loading Emails...</span>
                    </div>
                  ) : filteredEmails.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
                      <Mail className="w-8 h-8 text-slate-750 mb-1.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">No Emails Found</span>
                    </div>
                  ) : (
                    filteredEmails.map((email) => (
                      <button
                        key={email._id}
                        onClick={() => setSelectedEmailId(email._id)}
                        className="w-full text-left p-3 border-b border-slate-800/40 transition-all hover:bg-slate-800/30 flex flex-col gap-0.5 border-none cursor-pointer bg-transparent"
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="text-[9px] font-black text-slate-200 truncate max-w-[70%]">
                            {email.to}
                          </span>
                          <span className="text-[8px] text-slate-400 whitespace-nowrap shrink-0">
                            {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-[10px] font-black text-white truncate">
                          {email.subject}
                        </h4>
                        <p className="text-[9px] text-slate-400 truncate line-clamp-1">
                          {email.text}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] font-bold text-slate-450">
                            {new Date(email.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          {email.sent ? (
                            <span className="flex items-center gap-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[8px] font-black text-rose-455 uppercase tracking-widest" title={email.error}>
                              <AlertCircle className="w-2.5 h-2.5" /> Failed
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Mail Preview Pane */
                <div className="flex-1 border border-slate-800 rounded-lg flex flex-col overflow-hidden bg-slate-900">
                  {(() => {
                    const selectedEmail = emails.find(e => e._id === selectedEmailId);
                    if (!selectedEmail) return null;

                    return (
                      <div className="flex-1 flex flex-col min-h-0">
                        {/* Email Header Info */}
                        <div className="p-2.5 border-b border-slate-800 bg-slate-955/20">
                          <div className="flex items-center gap-2 mb-1.5">
                            <button
                              onClick={() => setSelectedEmailId(null)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white border-none cursor-pointer transition-colors"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <h3 className="text-[10px] font-black text-white uppercase tracking-wider truncate flex-1">
                              {selectedEmail.subject}
                            </h3>
                          </div>
                          <div className="space-y-0.5 text-[8px] text-slate-350">
                            <div className="flex gap-2">
                              <span className="font-extrabold uppercase text-slate-500">To:</span>
                              <span className="font-bold text-white truncate">{selectedEmail.to}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-extrabold uppercase text-slate-500">Date:</span>
                              <span>{new Date(selectedEmail.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-extrabold uppercase text-slate-500">Status:</span>
                              {selectedEmail.sent ? (
                                <span className="text-emerald-400 font-bold uppercase">Delivered</span>
                              ) : (
                                <span className="text-rose-400 font-bold uppercase" title={selectedEmail.error}>
                                  Failed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Email Content Body */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-2 bg-slate-900 no-scrollbar">
                          {selectedEmail.html ? (
                            <div className="border border-slate-800 rounded-lg overflow-hidden shadow-inner h-full min-h-[250px]">
                              <iframe 
                                srcDoc={selectedEmail.html}
                                className="w-full h-full min-h-[250px] border-none bg-white"
                                title="Email HTML Preview"
                                sandbox="allow-same-origin"
                              />
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                              {selectedEmail.text}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[7.5px] font-black uppercase text-slate-500 tracking-wider gap-0.5 text-center">
              <span>Showing up to 100 logs</span>
              <span>Secure SMTP sandbox sync</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

