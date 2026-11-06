'use client';
import { motion } from 'framer-motion';

// Re-mounts on every navigation, giving each page a smooth fade-in
export default function Template({ children }) {
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>{children}</motion.div>;
}
