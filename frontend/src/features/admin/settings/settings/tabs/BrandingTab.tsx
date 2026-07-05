import React, { useState } from 'react';
import { 
  Upload, Layout, Mail, Building, 
  Image, Sparkles, RefreshCw, Trash2, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBrandingStore, BrandingData } from '@/store/useBrandingStore';

interface BrandingTabProps {
  activeCategory: string;
  triggerToast: (msg: string) => void;
}

export function BrandingTab({ activeCategory, triggerToast }: BrandingTabProps) {
  const { branding, updateBrandingState, saveBranding, fetchBranding } = useBrandingStore();
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'login' | 'dashboard' | 'components'>('dashboard');

  if (activeCategory !== 'branding') return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'login-banner' | 'login-background' | 'watermark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(type);
    try {
      const token = localStorage.getItem('hr_system_token');
      // For logo, favicon, and login-banner use the specified API routes.
      // For background and watermark, use the generic /api/upload route.
      const endpoint = ['logo', 'favicon', 'login-banner'].includes(type) 
        ? `/api/company/${type}` 
        : '/api/upload';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (type === 'logo') updateBrandingState({ companyLogo: data.url });
        if (type === 'favicon') updateBrandingState({ favicon: data.url });
        if (type === 'login-banner') updateBrandingState({ loginBanner: data.url });
        if (type === 'login-background') updateBrandingState({ loginBackground: data.url });
        if (type === 'watermark') updateBrandingState({ companyWatermark: data.url });

        triggerToast(`${type.replace('-', ' ')} uploaded successfully!`);
      } else {
        triggerToast(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Server error during upload');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
          Company Branding Settings
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
        </h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Configure white-label identities, dynamic styling theme tokens, and custom login experiences</p>
      </div>

      {/* General Information Section */}
      <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-blue-500" />
          General Information
        </span>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
            <input 
              type="text" 
              value={branding.companyName || ''}
              onChange={e => updateBrandingState({ companyName: e.target.value })}
              className="saas-input w-full px-3 py-2"
              placeholder="e.g. Acme Technologies"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Short Name</label>
            <input 
              type="text" 
              value={branding.companyShortName || ''}
              onChange={e => updateBrandingState({ companyShortName: e.target.value })}
              className="saas-input w-full px-3 py-2"
              placeholder="e.g. Acme"
            />
          </div>
          <div className="space-y-1 col-span-1 lg:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Tagline</label>
            <input 
              type="text" 
              value={branding.companyTagline || ''}
              onChange={e => updateBrandingState({ companyTagline: e.target.value })}
              className="saas-input w-full px-3 py-2"
              placeholder="e.g. Building the Future of SaaS"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Website URL</label>
            <input 
              type="text" 
              value={branding.companyWebsite || ''}
              onChange={e => updateBrandingState({ companyWebsite: e.target.value })}
              className="saas-input w-full px-3 py-2"
              placeholder="e.g. https://acme.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Email</label>
            <input 
              type="email" 
              value={branding.companyEmail || ''}
              onChange={e => updateBrandingState({ companyEmail: e.target.value })}
              className="saas-input w-full px-3 py-2"
              placeholder="e.g. hr@acme.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
            <input 
              type="text" 
              value={branding.companyPhone || ''}
              onChange={e => updateBrandingState({ companyPhone: e.target.value })}
              className="saas-input w-full px-3 py-2"
              placeholder="e.g. +1 234 567 890"
            />
          </div>
          <div className="space-y-1 col-span-1 lg:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corporate Address</label>
            <textarea 
              rows={2}
              value={branding.companyAddress || ''}
              onChange={e => updateBrandingState({ companyAddress: e.target.value })}
              className="saas-textarea w-full p-3"
              placeholder="Enter complete office address..."
            />
          </div>
        </div>
      </div>

      {/* Login Page Customizer Section */}
      <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Layout className="w-3.5 h-3.5 text-blue-500" />
          Login Welcome customizer
        </span>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Welcome Portal Message</label>
          <input 
            type="text" 
            value={branding.welcomeMessage || ''}
            onChange={e => updateBrandingState({ welcomeMessage: e.target.value })}
            className="saas-input w-full px-3 py-2"
            placeholder="Welcome to Acme Technologies HR Portal"
          />
        </div>
      </div>

      {/* Email & PDF Customizer Section */}
      <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-blue-500" />
          Email Header Configuration
        </span>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl">
          <div className="text-left">
            <span className="font-black uppercase text-[9px] text-slate-900 dark:text-white block">Email Header Branding Logo</span>
            <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Embed custom branding header inside transactional notification templates</p>
          </div>
          <button
            type="button"
            onClick={() => updateBrandingState({ emailHeaderLogoVisible: !branding.emailHeaderLogoVisible })}
            className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer flex shrink-0 ${branding.emailHeaderLogoVisible ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-850 justify-start'}`}
          >
            <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
          </button>
        </div>
      </div>

      {/* Welcome Kit Documents Section */}
      <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Upload className="w-3.5 h-3.5 text-blue-500" />
          Welcome Kit Documents & Links
        </span>
        <p className="text-[8.5px] font-bold text-slate-400 uppercase mt-0.5">Upload PDFs/Documents or paste custom URL links for your team welcome portal kit.</p>

        <div className="space-y-4">
          {[
            { key: 'companyHandbookUrl', label: 'Company Handbook', desc: 'Policies, culture & values' },
            { key: 'hrPoliciesUrl', label: 'HR Policies & Leave Rules', desc: 'Leave, attendance & conduct' }
          ].map((item) => {
            const currentUrl = (branding as any)[item.key] || '';
            return (
              <div key={item.key} className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black uppercase text-[9px] text-slate-900 dark:text-white block">{item.label}</span>
                    <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">{item.desc}</p>
                  </div>
                  {currentUrl && (
                    <div className="flex items-center gap-2">
                      <a 
                        href={currentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-350 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                      >
                        Preview <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => updateBrandingState({ [item.key]: '' })}
                        className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* File Upload */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Upload Document File</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-500 cursor-pointer transition-all active:scale-[0.99] min-h-[44px]">
                        {uploading === item.key ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Choose File
                          </>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            setUploading(item.key);
                            try {
                              const token = localStorage.getItem('hr_system_token');
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` },
                                body: formData
                              });
                              const data = await res.json();
                              if (res.ok && data.url) {
                                updateBrandingState({ [item.key]: data.url });
                                triggerToast(`${item.label} file uploaded successfully!`);
                              } else {
                                triggerToast(data.error || 'Upload failed');
                              }
                            } catch (err) {
                              console.error(err);
                              triggerToast('Upload failed');
                            } finally {
                              setUploading(null);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Manual URL input */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Or Paste Custom URL Link</label>
                    <input 
                      type="text" 
                      value={currentUrl}
                      onChange={e => updateBrandingState({ [item.key]: e.target.value })}
                      className="saas-input w-full px-3 py-2.5 text-xs min-h-[44px]"
                      placeholder="https://example.com/handbook.pdf"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Changes Button */}
      <button
        type="button"
        onClick={async () => {
          try {
            await saveBranding();
            triggerToast('Company branding configuration updated successfully.');
          } catch (err: any) {
            triggerToast(err.message || 'Failed to update branding settings.');
          }
        }}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
      >
        Save Branding Configuration
      </button>
    </div>
  );
}
