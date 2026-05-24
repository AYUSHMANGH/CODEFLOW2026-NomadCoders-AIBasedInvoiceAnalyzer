import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 26 },
  },
};

interface ZenPageShellProps {
  children: React.ReactNode;
  title?: string;
  highlight?: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const ZenPageShell: React.FC<ZenPageShellProps> = ({
  children,
  title,
  highlight,
  subtitle,
  action,
  className = '',
}) => {
  const showHeader = title || highlight || subtitle || action;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className={`flex flex-col gap-6 text-left ${className}`}
    >
      {showHeader && (
        <motion.div
          variants={blockVariants}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
        >
          <div>
            {(title || highlight) && (
              <h1 className="text-2xl sm:text-3xl font-geist font-bold text-white tracking-tight">
                {title}
                {highlight && (
                  <>
                    {' '}
                    <span className="zen-gradient-text">{highlight}</span>
                  </>
                )}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </motion.div>
      )}

      <motion.div variants={blockVariants} className="flex flex-col gap-6">
        {children}
      </motion.div>
    </motion.div>
  );
};

interface ZenStaggerGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ZenStaggerGrid: React.FC<ZenStaggerGridProps> = ({
  children,
  className = '',
}) => (
  <motion.div
    variants={pageVariants}
    initial="hidden"
    animate="visible"
    className={className}
  >
    {React.Children.map(children, (child) =>
      child ? (
        <motion.div variants={blockVariants} className="h-full">
          {child}
        </motion.div>
      ) : null
    )}
  </motion.div>
);
