import { motion } from 'framer-motion'

/** The Veil logomark: a shield concealing an eye — privacy + protection. */
export function VeilMark({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      className={className}
      initial="hidden"
      animate="visible"
    >
      <defs>
        <linearGradient id="veilGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="60%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <motion.path
        d="M24 3 L42 10 V24 C42 35 34 42 24 45 C14 42 6 35 6 24 V10 Z"
        fill="url(#veilGrad)"
        fillOpacity="0.12"
        stroke="url(#veilGrad)"
        strokeWidth="1.8"
        variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      />
      <motion.path
        d="M13 24 C17 18 31 18 35 24 C31 30 17 30 13 24 Z"
        fill="none"
        stroke="url(#veilGrad)"
        strokeWidth="1.6"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }}
        transition={{ duration: 1, delay: 0.6 }}
      />
      <motion.circle
        cx="24"
        cy="24"
        r="3.4"
        fill="url(#veilGrad)"
        variants={{ hidden: { scale: 0 }, visible: { scale: 1 } }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 260 }}
        style={{ transformOrigin: '24px 24px' }}
      />
    </motion.svg>
  )
}
