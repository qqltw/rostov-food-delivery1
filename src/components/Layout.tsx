import React, { useState } from 'react';
import { BottomNav } from './BottomNav';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32">
      <AnimatePresence mode="wait">
        <motion.main
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="container mx-auto px-4 pt-6"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
