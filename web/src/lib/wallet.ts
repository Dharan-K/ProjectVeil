// Freighter wallet integration (official @stellar/freighter-api).
//
// Veil is a PRIVACY app: if the claimer paid gas from their own wallet, that
// wallet would be publicly linked to the claim — de-anonymising them. So the
// wallet is used only to obtain the recipient address that the zero-knowledge
// proof is *bound* to; a relayer submits the actual transaction. That means the
// connected wallet needs no funds and no particular network.

import { requestAccess } from '@stellar/freighter-api'

let currentAddress: string | null = null

function errText(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  const e = error as { message?: string }
  return e.message ?? ''
}

/** Prompt Freighter to connect; returns the selected account's address. */
export async function connectWallet(): Promise<string> {
  let res: { address?: string; error?: unknown }
  try {
    res = await requestAccess()
  } catch {
    throw new Error('Freighter not detected — install it from freighter.app, then refresh.')
  }
  if (res.error) {
    const msg = errText(res.error)
    if (/not|install|missing/i.test(msg)) {
      throw new Error('Freighter not detected — install it from freighter.app, then refresh.')
    }
    throw new Error(msg || 'Wallet connection was rejected.')
  }
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
