import { motion } from 'framer-motion'

/** Animated gradient mesh + grid + drifting particles behind everything. */
export default function Background() {
  const particles = Array.from({ length: 22 })
  return (
    <>
      <div className="veil-mesh" />
      <div className="veil-grid" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {particles.map((_, i) => {
          const left = (i * 47) % 100
          const size = 1 + (i % 3)
          const dur = 14 + (i % 7) * 3
          const delay = (i % 5) * 1.4
          return (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                width: size,
                height: size,
                background: i % 2 ? '#22d3ee' : '#7c5cff',
                opacity: 0.5,
              }}
              initial={{ y: '110vh' }}
              animate={{ y: '-10vh' }}
              transition={{ duration: dur, delay, repeat: Infinity, ease: 'linear' }}
            />
          )
        })}
      </div>
    </>
  )
}
