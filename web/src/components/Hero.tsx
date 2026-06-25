import { motion } from 'framer-motion'
import { Pill } from './ui'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 text-center">
      <motion.div variants={container} initial="hidden" animate="visible" className="flex flex-col items-center">
        <motion.div variants={item}>
          <Pill>
            <span className="h-1.5 w-1.5 rounded-full bg-veil-teal pulse-glow" />
            Zero-knowledge · Stellar Testnet · Groth16
          </Pill>
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-7 max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-7xl"
        >
          Prove you're <span className="grad-text">eligible</span>.
          <br /> Reveal <span className="grad-text">nothing</span> else.
        </motion.h1>

        <motion.p variants={item} className="mt-6 max-w-xl text-lg text-veil-dim">
          Veil lets approved recipients claim stablecoin disbursements on Stellar
          with a zero-knowledge proof — no names, no wallet linkage, no double-claims.
          The proof is generated <span className="text-veil-text">in your browser</span> and
          verified <span className="text-veil-text">on-chain</span>.
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <motion.a
            href="#demo"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glow-btn rounded-xl bg-white/10 px-7 py-3.5 font-display text-sm font-semibold text-white"
          >
            Generate a live proof →
          </motion.a>
          <a
            href="#how"
            className="rounded-xl border border-veil-border px-7 py-3.5 font-display text-sm font-semibold text-veil-text transition-colors hover:bg-white/5"
          >
            How it works
          </a>
        </motion.div>

        <motion.div variants={item} className="mt-14 grid grid-cols-3 gap-8 text-center sm:gap-14">
          {[
            ['100%', 'recipient privacy'],
            ['~2s', 'in-browser proof'],
            ['1×', 'claim per nullifier'],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-2xl font-semibold text-white sm:text-3xl">{n}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-veil-dim">{l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 flex flex-col items-center gap-2 text-veil-dim"
      >
        <span className="text-[11px] uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="h-8 w-5 rounded-full border border-veil-border"
        >
          <div className="mx-auto mt-1.5 h-1.5 w-1 rounded-full bg-veil-violet" />
        </motion.div>
      </motion.div>
    </section>
  )
}
