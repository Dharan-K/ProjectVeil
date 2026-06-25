import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide text-veil-text/80">
      {children}
    </span>
  )
}

export function Mono({ value, chars = 10 }: { value: string | bigint; chars?: number }) {
  const s = value.toString()
  const short = s.length > chars * 2 ? `${s.slice(0, chars)}…${s.slice(-chars)}` : s
  return <span className="mono text-veil-cyan" title={s}>{short}</span>
}

export function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-veil-violet"
      >
        {kicker}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ delay: 0.05 }}
        className="font-display text-3xl font-semibold text-white sm:text-4xl"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mt-4 text-veil-dim"
        >
          {sub}
        </motion.p>
      )}
    </div>
  )
}

export function GlowButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`glow-btn rounded-xl px-6 py-3 font-display text-sm font-semibold tracking-wide transition-colors ${
        disabled
          ? 'cursor-not-allowed bg-white/5 text-veil-dim'
          : 'bg-white/10 text-white hover:bg-white/15'
      }`}
    >
      {children}
    </motion.button>
  )
}
