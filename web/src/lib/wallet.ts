// Freighter wallet integration (official @stellar/freighter-api).
// Lets the user connect their Stellar wallet, then sign the on-chain claim
// transaction with it instead of the built-in demo key.

import {
  isConnected,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api'
import { NETWORK_PASSPHRASE } from './stellar'

let currentAddress: string | null = null

function errText(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  const e = error as { message?: string }
  return e.message ?? 'Unknown wallet error'
}

/** Prompt Freighter to connect; returns the selected account's address. */
export async function connectWallet(): Promise<string> {
  const conn = await isConnected().catch(() => ({ isConnected: false }))
  if (!conn?.isConnected) {
    throw new Error('Freighter not detected — install it from freighter.app, then retry.')
  }
  const res = await requestAccess()
  if (res.error) throw new Error(errText(res.error))
  if (!res.address) throw new Error('No account returned by the wallet.')
  currentAddress = res.address
  return res.address
}

export function getConnectedAddress(): string | null {
  return currentAddress
}

/** Freighter has no programmatic disconnect; we just forget the address. */
export async function disconnectWallet(): Promise<void> {
  currentAddress = null
}

/** Ask Freighter to sign a transaction XDR; returns the signed XDR. */
export async function signTransactionXdr(xdr: string): Promise<string> {
  const res = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: currentAddress ?? undefined,
  })
  if (res.error) throw new Error(errText(res.error))
  return res.signedTxXdr
}
