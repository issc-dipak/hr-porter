"use client";

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

// ── Permission Context Types ────────────────────────────────────────────────
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
  branchId?: string;
  [key: string]: any;
}

interface PermissionContextType {
  currentUser: UserProfile;
  role: string;
  permissions: string[];
  companyId?: string;
  branchId?: string;
  can: (key: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// ── Provider Component ───────────────────────────────────────────────────────
export function PermissionProvider({ children }: { children: ReactNode }) {
  const profile = useAuthStore(state => state.profile);
  const userRole = useAuthStore(state => state.userRole);
  const userPermissions = useAuthStore(state => state.userPermissions);
  const hasPermission = useAuthStore(state => state.hasPermission);

  const currentUser: UserProfile = {
    ...profile,
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: userRole,
    companyId: profile.companyId,
    branchId: profile.branchId
  };

  const can = (key: string): boolean => {
    return hasPermission(key);
  };

  const value: PermissionContextType = {
    currentUser,
    role: userRole,
    permissions: userPermissions,
    companyId: profile.companyId,
    branchId: profile.branchId,
    can
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// ── Custom Hooks ─────────────────────────────────────────────────────────────
export function usePermission() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return { can: context.can, permissions: context.permissions };
}

export function useRole() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('useRole must be used within a PermissionProvider');
  }
  return { role: context.role, isSuperAdmin: context.role === 'Super Admin' || context.role === 'Admin' };
}

export function useCurrentUser() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a PermissionProvider');
  }
  return context.currentUser;
}

// ── Helper Components for Hiding Elements ───────────────────────────────────
interface PermissionGateProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { can } = usePermission();
  if (!can(permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

// ── Custom Guarded Elements ──────────────────────────────────────────────────
export function PermissionButton({
  permission,
  children,
  ...props
}: {
  permission: string;
  children: ReactNode;
  [key: string]: any;
}) {
  const { can } = usePermission();
  if (!can(permission)) return null;
  return <button {...props}>{children}</button>;
}
