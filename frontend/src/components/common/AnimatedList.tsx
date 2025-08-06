'use client';

import { motion, Variants } from 'framer-motion';

// Varian untuk kontainer/pembungkus daftar
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      // Menambahkan penundaan antara setiap item anak yang muncul
      staggerChildren: 0.07, // 70ms delay antara setiap item
    },
  },
};

// Varian untuk setiap item di dalam daftar
export const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20, // Mulai sedikit dari bawah
    scale: 0.98 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 1, 0.5, 1], // Kurva easing yang halus
    },
  },
};

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Komponen wrapper yang secara otomatis memberikan animasi stagger
 * (muncul satu per satu) untuk semua elemen anaknya.
 */
export const AnimatedList: React.FC<AnimatedListProps> = ({ children, className }) => {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};