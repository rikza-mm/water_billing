'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface NeumorphicCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({ 
  children, 
  className = "", 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0,
        y: 20,
        boxShadow: 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff'
      }}
      animate={{ 
        opacity: 1,
        y: 0,
        boxShadow: '8px 8px 16px #bebebe, -8px -8px 16px #ffffff'
      }}
      transition={{ 
        duration: 0.6,
        delay,
        ease: "easeOut"
      }}
      className={`bg-[#e0e5ec] rounded-xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};