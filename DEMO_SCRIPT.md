# Veil — 2–3 minute demo video script

A suggested walkthrough. You don't need to be on camera; screen recording + voiceover is fine.

## 0:00 — Hook (15s)
> "When an NGO or DAO pays a list of approved people on a public blockchain, everyone can see exactly who got paid. Veil fixes that with zero-knowledge proofs — prove you're eligible, reveal nothing else — verified on Stellar."

Show the **hero section** (the animated landing). Scroll slowly so the gradient text and particles are visible.

## 0:15 — The idea (25s)
Scroll through **"How it works"** (4 steps) and the **Architecture** section.
> "An organization publishes a Merkle root of approved recipients. Each person holds a secret ticket. To claim, your browser builds a Groth16 proof that your commitment is in the tree — without revealing which one — plus a one-time nullifier."

## 0:40 — Live proof, in the browser (45s)
Go to the **Live demo** section.
1. Point out the **"Verify on testnet"** toggle is selected and click the **contract ↗** link briefly to show it's a real deployed contract on stellar.expert.
2. Pick **Recipient #3**. Show the private claim ticket (nullifier / secret / commitment).
3. Click **Generate zero-knowledge proof**. Narrate the staged steps:
   > "This is a real Groth16 proof being generated in the browser with snarkjs — the secret never leaves my machine."
4. Show the generated proof + public signals, and the **Merkle tree lighting up the inclusion path** on the right.

## 1:25 — Verify on-chain (35s)
Click **Verify & claim on Stellar testnet**.
> "The proof goes to our Soroban contract, which runs the BN254 pairing check using Stellar's native host functions and records the nullifier."

When **"Disbursement released"** appears, click the **tx hash (on-chain)** link to open the real transaction on stellar.expert.

## 2:00 — Double-spend protection (25s)
Click **Run another claim**, pick the **same Recipient #3**, generate, and submit again.
> "Same ticket, same nullifier — the contract rejects it on-chain. One claim per recipient, enforced by the chain."

Show the **"already been spent on-chain"** rejection.

## 2:25 — Close (15s)
> "Real money, real privacy. The ZK is load-bearing — remove it and you're left with a public list of who got paid. Veil, on Stellar."

Optionally show `cargo test` passing (the real BN254 pairing check on-host) and the impostor → rejection path.

---

### Pre-flight checklist
- `cd web && npm run dev`, open http://localhost:5173
- Network up (testnet round-trip ~10–20s)
- Have stellar.expert ready in another tab
- The "Local verify" toggle is a good fallback if the network is flaky during recording
