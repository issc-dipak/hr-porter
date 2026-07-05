"use client";

import React, { useState } from 'react';
import { FileText, Search, UploadCloud, Eye, Download, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface DocumentsTabProps {
  addNotification?: (msg: string) => void;
}

export default function DocumentsTab({ addNotification }: DocumentsTabProps) {
  // Document Vault State
  const [documents, setDocuments] = useState([
    { id: 'doc1', name: 'Signed Employment Agreement.pdf', type: 'Agreement', size: '2.4 MB', date: '12 Jan 2024', status: 'Verified' },
    { id: 'doc2', name: 'Offer Letter.pdf', type: 'Offer Letter', size: '1.8 MB', date: '05 Jan 2024', status: 'Verified' },
    { id: 'doc3', name: 'Aadhaar Card.pdf', type: 'ID Proof', size: '940 KB', date: '15 Jan 2024', status: 'Pending Verification' },
    { id: 'doc4', name: 'Graduation Degree.pdf', type: 'Education', size: '3.1 MB', date: '15 Jan 2024', status: 'Pending Verification' },
  ]);

  const [uploadType, setUploadType] = useState('Agreement');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [searchDocTerm, setSearchDocTerm] = useState('');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<any>(null);

  const handleDownload = (docName: string) => {
    alert(`Downloading ${docName}...`);
  };

  return (
    <div className="space-y-6 text-left relative">
      {/* Document Type Selector & Upload Box */}
      <div className="p-4.5 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Upload New Document</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Select category and upload PDF or Image</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Type:</label>
            <select 
              value={uploadType} 
              onChange={(e) => setUploadType(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold outline-none text-slate-900 dark:text-white"
            >
              <option>Agreement</option>
              <option>Offer Letter</option>
              <option>ID Proof</option>
              <option>PAN Card</option>
              <option>Education</option>
              <option>Payslip</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Interactive Dropzone */}
        <div className="relative group border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-xl p-6 text-center transition-all bg-white dark:bg-slate-900/50">
          <input 
            type="file" 
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setUploadFileName(file.name);
                setIsUploading(true);
                setUploadProgress(0);
                
                // Simulating realistic upload speed
                const interval = setInterval(() => {
                  setUploadProgress(prev => {
                    if (prev >= 100) {
                      clearInterval(interval);
                      setTimeout(() => {
                        setIsUploading(false);
                        const newDoc = {
                          id: 'doc_' + Date.now(),
                          name: file.name,
                          type: uploadType,
                          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                          status: 'Pending Verification'
                        };
                        setDocuments((prevDocs: any) => [newDoc, ...prevDocs]);
                        if (addNotification) addNotification(`Uploaded ${file.name} successfully!`);
                      }, 50);
                      return 100;
                    }
                    return prev + 50;
                  });
                }, 20);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center space-y-3">
            {isUploading ? (
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs font-black uppercase text-slate-405 dark:text-slate-400">
                  <span className="truncate pr-4 text-slate-900 dark:text-white">Uploading {uploadFileName}...</span>
                  <span className="text-blue-500">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-600 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">Drag & drop or click to upload</p>
                  <p className="text-[9px] text-slate-405 dark:text-slate-400 font-bold uppercase mt-0.5">Supports PDF, PNG, JPG up to 10MB</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Documents Directory Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Uploaded Documents ({documents.length})</h4>
          <div className="min-w-[240px]">
            <input 
              type="text" 
              placeholder="Search documents..."
              value={searchDocTerm}
              onChange={(e) => setSearchDocTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-transparent focus:border-blue-500/50 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* List of Documents */}
        <div className="grid grid-cols-1 gap-3">
          {documents.filter(doc => doc.name.toLowerCase().includes(searchDocTerm.toLowerCase()) || doc.type.toLowerCase().includes(searchDocTerm.toLowerCase())).map((doc) => (
            <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:border-blue-500/20 transition-all gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-450 shadow-sm shrink-0">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="truncate max-w-[240px] sm:max-w-xs">
                  <p className="text-xs font-black text-slate-950 dark:text-white truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-wider rounded">{doc.type}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{doc.size}</span>
                    <span className="text-[9px] text-slate-400 font-bold">•</span>
                    <span className="text-[9px] text-slate-400 font-bold">{doc.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                  doc.status === 'Verified' 
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500" 
                    : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500"
                )}>
                  {doc.status}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setSelectedPreviewDoc(doc)}
                    className="p-2 bg-white dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-955/30 text-slate-405 hover:text-blue-500 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm transition-all cursor-pointer"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDownload(doc.name)}
                    className="p-2 bg-white dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-955/30 text-slate-405 hover:text-blue-500 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm transition-all cursor-pointer"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      setDocuments((prev: any) => prev.filter((d: any) => d.id !== doc.id));
                      if (addNotification) addNotification(`Deleted ${doc.name}`);
                    }}
                    className="p-2 bg-white dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-955/30 text-slate-405 hover:text-rose-500 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Preview Overlay Modal */}
      <AnimatePresence>
        {selectedPreviewDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] max-w-lg w-full p-6 space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedPreviewDoc(null)}
                className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-405 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0 shadow-inner">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-xs">{selectedPreviewDoc.name}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Type: {selectedPreviewDoc.type} • Status: {selectedPreviewDoc.status}
                  </p>
                </div>
              </div>

              {/* Simulated document contents */}
              <div className="p-8 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-[1.5rem] text-center border-2 border-dashed">
                <FileText className="w-16 h-16 text-slate-350 dark:text-slate-700 mx-auto animate-pulse mb-3" />
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">Previewing Encrypted Vault Document</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">
                  Confidential Verification Protocol Active. Size: {selectedPreviewDoc.size}
                </p>
              </div>

              <div className="flex justify-end gap-3.5">
                <button 
                  onClick={() => setSelectedPreviewDoc(null)}
                  className="px-4.5 py-2.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    handleDownload(selectedPreviewDoc.name);
                    setSelectedPreviewDoc(null);
                  }}
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  Download File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
