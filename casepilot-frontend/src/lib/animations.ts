import { Box, Paper, Stack, Typography } from '@mui/material';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';

// ─── Motion-wrapped MUI components ───────────────────────────────────
export const MotionBox = motion.create(Box);
export const MotionPaper = motion.create(Paper);
export const MotionStack = motion.create(Stack);
export const MotionTypography = motion.create(Typography);

// ─── Reusable variant presets ────────────────────────────────────────

/** Stagger container — wrap a group of children that each use a child variant */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

/** Standard fade-in + slide-up entrance (for headings, paragraphs, sections) */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/** Card / Paper reveal — subtle scale + fade */
export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

/** Slide in from the left */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/** Slide in from the right */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/** Fade in only (no movement) */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

/** Scale up from center — good for icons, badges */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** List item entrance — slight x offset + fade */
export const listItem: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// ─── Hover presets (for use with whileHover) ─────────────────────────

/** Subtle card lift on hover */
export const hoverLift = { y: -4, boxShadow: '0 16px 36px rgba(17, 43, 68, 0.14)' };

/** Gentle scale on hover */
export const hoverScale = { scale: 1.02 };
