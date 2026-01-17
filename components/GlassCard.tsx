import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`backdrop-blur-xl bg-white/70 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-6 text-slate-800 ${className}`}>
      {children}
    </div>
  );
};