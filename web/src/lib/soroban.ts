import {
  rpc,
  Contract,
  TransactionBuilder,
  Keypair,
  xdr,
  Networks,
  BASE_FEE,
} from '@stellar/stellar-sdk'
import type { ClaimWitness } from './prover'
import { witnessToOnChain } from './bn254'
import {
  CONTRACT_ID,
  RPC_URL,
  DEMO_SECRET,
  EXPLORER_TX,
  type OnChainResult,
} from './stellar'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const toScBytes = (u8: Uint8Array) => xdr.ScVal.scvBytes(Buffer.from(u8))

/**
 * Submit a Groth16 eligibility proof to the deployed VeilVerifier contract on
 * Stellar testnet. The contract verifies the BN254 pairing on-chain and spends
 * the nullifier; we return the resulting transaction hash.
 */
export async function invokeVerifier(witness: ClaimWitness): Promise<OnChainResult> {
  const server = new rpc.Server(RPC_URL)
  const kp = Keypair.fromSecret(DEMO_SECRET)

  const oc = witnessToOnChain(witness.proof, witness.publicSignals)

  // Proof struct -> ScVal map { a, b, c } (keys sorted, values = Bytes).
  const proofVal = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('a'), val: toScBytes(oc.proof.a) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('b'), val: toScBytes(oc.proof.b) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('c'), val: toScBytes(oc.proof.c) }),
  ])
  // signals: Vec<BytesN<32>>
  const signalsVal = xdr.ScVal.scvVec(oc.signals.map(toScBytes))

  const contract = new Contract(CONTRACT_ID)
  const source = await server.getAccount(kp.publicKey())

  let tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call('claim', proofVal, signalsVal))
    .setTimeout(60)
    .build()

  // Simulate + assemble. A contract error (e.g. nullifier already spent) throws.
  try {
    tx = await server.prepareTransaction(tx)
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e)
    const friendly = /#3/.test(msg)
      ? 'This nullifier has already been spent on-chain. Double-claim rejected.'
      : /#2/.test(msg)
        ? 'On-chain proof verification failed.'
        : `Simulation failed: ${msg}`
    return { ok: false, mode: 'testnet', txHash: '', nullifierHash: witness.nullifierHash, error: friendly }
  }

  tx.sign(kp)
  const sent = await server.sendTransaction(tx)
  if (sent.status === 'ERROR') {
    return {
      ok: false,
      mode: 'testnet',
      txHash: sent.hash,
      nullifierHash: witness.nullifierHash,
      error: 'Transaction submission was rejected by the network.',
    }
  }

  // Poll for finality.
  let got = await server.getTransaction(sent.hash)
  for (let i = 0; i < 20 && got.status === 'NOT_FOUND'; i++) {
    await sleep(1200)
    got = await server.getTransaction(sent.hash)
  }

  if (got.status !== 'SUCCESS') {
    return {
      ok: false,
      mode: 'testnet',
      txHash: sent.hash,
      nullifierHash: witness.nullifierHash,
      error: `Transaction did not succeed (status: ${got.status}).`,
      explorerUrl: EXPLORER_TX(sent.hash),
    }
  }

  return {
    ok: true,
    mode: 'testnet',
    txHash: sent.hash,
    nullifierHash: witness.nullifierHash,
    explorerUrl: EXPLORER_TX(sent.hash),
  }
}
