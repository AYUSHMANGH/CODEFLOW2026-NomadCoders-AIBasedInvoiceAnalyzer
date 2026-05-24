import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  pulseGlow?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  pulseGlow = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        zen-glass-card
        p-6 
        transition-all 
        duration-300 
        ${hoverEffect ? 'hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(59,130,246,0.18)] cursor-pointer' : ''}
        ${pulseGlow ? 'animate-pulse-glow' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
