import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import {
  connectWallet,
  disconnectWallet,
  getConnectedAddress,
  signTransactionXdr,
} from '../lib/wallet'

interface WalletCtx {
  address: string | null
  connecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  signXdr: (xdr: string) => Promise<string>
}

const Ctx = createContext<WalletCtx | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(getConnectedAddress())
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const a = await connectWallet()
      setAddress(a)
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Could not connect'
      if (!/cancelled/i.test(msg)) setError(msg)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    void disconnectWallet()
    setAddress(null)
  }, [])

  return (
    <Ctx.Provider value={{ address, connecting, error, connect, disconnect, signXdr: signTransactionXdr }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet(): WalletCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useWallet must be used within WalletProvider')
  return c
}
