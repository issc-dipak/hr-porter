'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EmployeeSelfSetup } from '@/features/auth/EmployeeSelfSetup';

export default function OnboardingTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const handleComplete = () => {
    router.push('/');
  };

  if (!token) return null;

  return (
    <EmployeeSelfSetup token={token} onComplete={handleComplete} />
  );
}
