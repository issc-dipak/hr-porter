"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban, Plus, Search, Filter, LayoutGrid, List, Kanban,
  Calendar, RefreshCcw, ChevronRight, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Clock, Users, DollarSign, BarChart3,
  Target, Activity, Loader2, MoreVertical, Edit2, Trash2, Copy,
  ArrowUpRight, Star, Zap, Shield, Archive, Eye, Play, Pause,
  X, ChevronDown, Building2, Tag, User, Flag, Globe, FileText,
  Settings, Layers, PieChart, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import CreateProjectModal from './components/CreateProjectModal';
import EmployeeWorkspace from './components/EmployeeWorkspace';
import { useAuthStore } from '@/store/authStore';

const API = '';

function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

export default function ProjectsPage({ role = 'Admin' }: { role?: string }) {
  const { profile } = useAuthStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'detail'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/employees`, { headers: getHeaders() as any })
      .then(r => r.json())
      .then(d => setEmployees(Array.isArray(d) ? d : d.data || d.employees || []))
      .catch(() => {});
  }, []);

  const handleOpenProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('detail');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedProjectId(null);
  };

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    if (currentView === 'dashboard') setCurrentView('list');
  };

  if (role === 'Employee') {
    return <EmployeeWorkspace profile={profile} employees={employees} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 min-h-screen">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Projects</h1>
            <p className="text-xs text-slate-400">Enterprise Project Management</p>
          </div>
          {selectedProjectId && currentView === 'detail' && (
            <button onClick={handleBack} className="ml-3 flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors">
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              Back to Projects
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          {currentView !== 'detail' && (
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'list'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                Projects
              </button>
            </div>
          )}

          {role !== 'HR' && role !== 'Reporting Manager' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ProjectDashboard onOpenProject={handleOpenProject} onNewProject={() => setShowCreateModal(true)} onViewAll={() => setCurrentView('list')} />
            </motion.div>
          )}
          {currentView === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ProjectList onOpenProject={handleOpenProject} onNewProject={() => setShowCreateModal(true)} employees={employees} />
            </motion.div>
          )}
          {currentView === 'detail' && selectedProjectId && (
            <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ProjectDetail projectId={selectedProjectId} onBack={handleBack} employees={employees} role={role} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Create Project Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleProjectCreated}
            employees={employees}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
