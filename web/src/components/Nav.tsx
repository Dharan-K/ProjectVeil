import { motion } from 'framer-motion'
import { VeilMark } from './VeilMark'

export default function Nav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav className="glass flex w-full max-w-5xl items-center justify-between rounded-2xl px-5 py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <VeilMark className="h-7 w-7" />
          <span className="font-display text-lg font-semibold tracking-tight text-white">Veil</span>
          <span className="hidden text-xs text-veil-dim sm:inline">· ZK on Stellar</span>
        </a>
        <div className="hidden items-center gap-7 text-sm text-veil-dim md:flex">
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#demo" className="transition-colors hover:text-white">Live demo</a>
          <a href="#stack" className="transition-colors hover:text-white">Stack</a>
        </div>
        <a
          href="#demo"
          className="rounded-lg bg-veil-violet/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-veil-violet"
        >
          Try it
        </a>
      </nav>
    </motion.header>
  )
}
