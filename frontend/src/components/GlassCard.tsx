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
        glass-panel 
        p-6 
        transition-all 
        duration-300 
        ${hoverEffect ? 'hover:scale-[1.02] hover:bg-opacity-80 hover:border-glass-shine hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer' : ''}
        ${pulseGlow ? 'animate-pulse-glow' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
