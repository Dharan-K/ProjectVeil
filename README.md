# Veil — Private Eligibility Proofs for Stablecoin Disbursements on Stellar

> **Stellar Hacks: Real-World ZK** submission.
> Prove you're an approved recipient and claim a payment **without revealing who you are** — using a zero-knowledge proof generated in your browser and **verified on-chain by a Soroban smart contract** on Stellar testnet.

![status](https://img.shields.io/badge/ZK-Groth16%2FBN254-7c5cff) ![chain](https://img.shields.io/badge/Stellar-Soroban%20testnet-22d3ee) ![prover](https://img.shields.io/badge/proof-in--browser%20snarkjs-2dd4bf)

---

## The problem

Stellar moves real money — stablecoins, aid, payroll, cross-border settlement. But disbursement lists are a privacy disaster: the moment an NGO, DAO, or employer pays a list of approved people on a public ledger, **everyone can see exactly who received what**. Recipients of aid, whistleblower grants, or sensitive payments get doxxed by the very transparency that makes the chain trustworthy.

## The idea

**Veil** decouples *eligibility* from *identity*.

1. An organization publishes a Merkle **root** of approved-recipient *commitments*.
2. Each recipient privately holds a secret ticket `(nullifier, secret)`; their leaf is `commitment = Poseidon(nullifier, secret)`.
3. To claim, the recipient generates a **zero-knowledge proof** that their commitment is in the tree — **without revealing which leaf** — plus a one-time **nullifier hash**.
4. A **Soroban contract verifies the proof on-chain** using Stellar's native BN254 host functions, records the nullifier to block double-claims, and authorizes the disbursement.

Nobody — not even the paying organization — can link a claim back to a person. Remove the ZK layer and the whole thing collapses into a public spreadsheet of who got paid. **The proof is load-bearing.**

---

## Where the ZK is doing real work

| Property | How |
|---|---|
| **Eligibility without identity** | Groth16 proof of Merkle membership over a Poseidon tree. The leaf index, nullifier, and secret stay private. |
| **No double-claims** | The circuit derives `nullifierHash = Poseidon(nullifier)`; the contract stores spent nullifiers in persistent storage. |
| **No front-running** | The proof is bound to the claiming `recipient` address inside the circuit (anti-malleability). |
| **Cheap on-chain verification** | BN254 Groth16 → ~300-byte proof, verified with Stellar's Protocol 25/26 `bn254` pairing host function. |

---

## Architecture

```
 Browser (no secrets ever leave)                    Stellar testnet
┌─────────────────────────────────┐                ┌────────────────────────────┐
│ React + Vite + Framer Motion     │   proof + pub  │ Soroban: VeilVerifier        │
│ ┌─────────────────────────────┐  │   signals      │ ┌────────────────────────┐  │
│ │ circomlibjs  → Poseidon tree│  │  ───────────►  │ │ bn254.pairing_check()  │  │
│ │ snarkjs      → Groth16 proof│  │                │ │ embedded verifying key │  │
│ └─────────────────────────────┘  │                │ │ nullifier registry     │  │
└─────────────────────────────────┘                │ └────────────────────────┘  │
        ▲ circuit: veil.circom (Circom 2)           └────────────────────────────┘
        │ Merkle membership + nullifier, ~6.1k constraints
```

| Layer | Tech |
|---|---|
| Circuit | **Circom 2** — `circuits/veil.circom` (Merkle membership + nullifier, Poseidon) |
| Proof system | **Groth16** over **BN254**, trusted setup via **snarkjs** |
| Prover | **snarkjs** running in the **browser** (WASM) — secrets never leave the device |
| On-chain verifier | **Soroban** contract — `contracts/veil_verifier` (Rust, `soroban-sdk` 26, `bn254` host functions) |
| Frontend | **Vite + React + TypeScript + Tailwind v4 + Framer Motion** |

---

## Repository layout

```
circuits/            Circom circuit, trusted setup, snarkjs helpers, fixture exporter
  veil.circom        the ZK circuit
  lib/veilTree.mjs   Poseidon Merkle tree (shared with the frontend)
  export_fixture.mjs snarkjs proof → Stellar host byte layout (vk.rs / fixture.rs / onchain.json)
contracts/
  veil_verifier/     Soroban BN254 Groth16 verifier + nullifier registry
    src/lib.rs       the contract
    src/vk.rs        embedded verifying key (auto-generated)
    src/test.rs      3 tests incl. a real on-host BN254 pairing check
web/                 animated React frontend with in-browser proving
```

---

## Running it

### Circuit + trusted setup (already committed, but to reproduce)
```bash
cd circuits
# compile + Groth16 setup produce veil.wasm, veil_final.zkey, verification_key.json
node test_proof.mjs        # end-to-end proof + verify sanity check
node export_fixture.mjs    # regenerate contract vk.rs / fixture.rs / onchain.json
```

### Contract
```bash
cd contracts/veil_verifier
cargo test                                          # runs the real BN254 pairing check on-host
cargo build --target wasm32v1-none --release        # Soroban requires the wasm32v1-none target
stellar contract deploy \
  --wasm target/wasm32v1-none/release/veil_verifier.wasm \
  --source <key> --network testnet
```

### Frontend
```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

The frontend has a **Local / Testnet** toggle: *Testnet* submits the proof to the live deployed contract; *Local* verifies in-browser (useful offline).

---

## On-chain deployment

- **Network:** Stellar testnet
- **Contract ID:** [`CCZVOEJROWSEN3MQWLSWRJXU5JWEKKLYK6FRWLKPRNAGA2MVSREZPWLA`](https://stellar.expert/explorer/testnet/contract/CCZVOEJROWSEN3MQWLSWRJXU5JWEKKLYK6FRWLKPRNAGA2MVSREZPWLA)
- **A proof verified on-chain** (`claim`): [tx 9f124834…](https://stellar.expert/explorer/testnet/tx/9f124834d8ff3c534c410cb16f165c619cbd23f7755a87c7454fc60986eebe1e)
- **A proof submitted live from the browser:** [tx 5c7e468a…](https://stellar.expert/explorer/testnet/tx/5c7e468aef638343fc1049fa090051f84db2e1d90f1a0fb8cd60c54cd9b75ec8)
- Replaying a spent nullifier is rejected on-chain with `NullifierAlreadySpent` (`Error #3`).

Full details in [`deployment.json`](deployment.json).

---

## Honest status / what's mocked

This is a hackathon build. To be transparent:

- **Real:** the Circom circuit, the Groth16 trusted setup, **in-browser proof generation (snarkjs)**, the Soroban verifier contract, and **on-chain BN254 pairing verification** (validated by `cargo test` and a live testnet deployment).
- **Demo conveniences:** the frontend generates a fresh demo organization (random approved recipients) each session so you can "be" a recipient instantly. The disbursed *funds* are illustrative — the contract verifies the proof and spends the nullifier, but does not custody a real stablecoin balance in this PoC.
- **Frontend ↔ chain:** see `web/src/lib/stellar.ts`. A throwaway, value-less testnet key pays fees so the public demo needs no wallet.

---

## Why Stellar

Protocol 25 ("X-Ray") and 26 ("Yardstick") moved BN254 elliptic-curve math and Poseidon hashing into native host functions. That makes Groth16 verification — the exact operation Veil needs — cheap enough to run in a smart contract. Veil is a small, real demonstration of that capability pointed at a genuine real-world-money problem.
