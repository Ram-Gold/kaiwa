'use client';

import { motion } from 'motion/react';

export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full flex-1"
    >
      {children}
    </motion.div>
  );
}
