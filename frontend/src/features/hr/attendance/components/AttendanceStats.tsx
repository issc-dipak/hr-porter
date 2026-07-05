"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';

interface AttendanceStatsProps {
  stats: any[];
}

const colorMap: Record<string, string> = {
  'Present': '#10B981', // Emerald
  'Late': '#F59E0B',    // Amber
  'On Leave': '#3B82F6',// Blue
  'Absent': '#F43F5E',  // Rose
};

export default function AttendanceStats({ stats }: AttendanceStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
      {stats.map((stat, idx) => {
        const accent = colorMap[stat.label] || '#6366F1';
        const subText = stat.label === 'Present' ? 'On-time check-ins'
                      : stat.label === 'Late' ? 'Check-ins after shift start'
                      : stat.label === 'On Leave' ? 'Approved time off'
                      : 'No check-in recorded';

        return (
          <PastelStatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={subText}
            accent={accent}
          />
        );
      })}
    </div>
  );
}
