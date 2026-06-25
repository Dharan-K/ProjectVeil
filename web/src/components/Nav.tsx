import { motion } from 'framer-motion'
import { VeilMark } from './VeilMark'
import { useWallet } from './WalletContext'

function shortAddr(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`
}

export default function Nav() {
  const { address, connecting, error, connect, disconnect } = useWallet()
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
        <div className="relative">
          {address ? (
            <button
              onClick={disconnect}
              title="Click to disconnect"
              className="group flex items-center gap-2 rounded-lg border border-veil-teal/40 bg-veil-teal/10 px-4 py-2 text-sm font-semibold text-veil-teal transition-colors hover:bg-veil-teal/15"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-veil-teal pulse-glow" />
              <span className="mono">{shortAddr(address)}</span>
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="rounded-lg bg-veil-violet/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-veil-violet disabled:opacity-60"
            >
              {connecting ? 'Connecting…' : 'Connect wallet'}
            </button>
          )}
          {error && !address && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-veil-pink/40 bg-veil-panel/95 p-3 text-xs text-veil-pink shadow-xl">
              {error}
              {/freighter/i.test(error) && (
                <>
                  {' '}
                  <a href="https://www.freighter.app/" target="_blank" rel="noreferrer" className="underline">
                    Get Freighter ↗
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </motion.header>
  )
}
