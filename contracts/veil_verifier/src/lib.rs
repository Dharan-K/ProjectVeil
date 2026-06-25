#![no_std]
//! Veil — on-chain BN254 Groth16 verifier for private eligibility claims.
//!
//! Verifies a snarkjs/Circom Groth16 proof (BN254 curve) using Stellar's
//! Protocol 25/26 BN254 host functions, then records the proof's nullifier so
//! the same eligibility ticket can never be claimed twice.
//!
//! Public signals (in order): [root, nullifierHash, recipient].
//!
//! The verifying key is fixed by the circuit's trusted setup, so it is embedded
//! as constants (see `vk.rs`) — no constructor/initialization is required.
//!
//! Byte encoding expected by the BN254 host functions:
//!   * Fr / Fp : 32-byte big-endian
//!   * G1Affine: be(X) || be(Y)                                  (64 bytes)
//!   * G2Affine: be(X.c1) || be(X.c0) || be(Y.c1) || be(Y.c0)    (128 bytes)
//!
//! NOTE: `proof.a` is supplied already negated (−A) by the caller, so the
//! pairing check is e(−A,B)·e(α,β)·e(vk_x,γ)·e(C,δ) == 1.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    vec, BytesN, Env, Vec,
};

mod vk;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    MalformedSignals = 1,
    InvalidProof = 2,
    NullifierAlreadySpent = 3,
}

/// Groth16 proof. `a` is the *negated* A point (−A).
#[derive(Clone)]
#[contracttype]
pub struct Proof {
    pub a: BytesN<64>,   // G1 (−A)
    pub b: BytesN<128>,  // G2
    pub c: BytesN<64>,   // G1
}

#[contracttype]
enum DataKey {
    Spent(BytesN<32>),
}

#[contract]
pub struct VeilVerifier;

#[contractimpl]
impl VeilVerifier {
    /// Pure Groth16 verification against the embedded verifying key.
    /// `signals` are the public inputs as 32-byte big-endian Fr values
    /// in order [root, nullifierHash, recipient].
    pub fn verify(env: Env, proof: Proof, signals: Vec<BytesN<32>>) -> bool {
        Self::verify_with(&env, &proof, &signals)
    }

    /// Verify an eligibility proof and atomically spend its nullifier.
    /// Returns the spent nullifier hash on success.
    pub fn claim(env: Env, proof: Proof, signals: Vec<BytesN<32>>) -> Result<BytesN<32>, Error> {
        if signals.len() != 3 {
            return Err(Error::MalformedSignals);
        }
        if !Self::verify_with(&env, &proof, &signals) {
            return Err(Error::InvalidProof);
        }

        let nullifier = signals.get(1).unwrap();
        let key = DataKey::Spent(nullifier.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::NullifierAlreadySpent);
        }
        env.storage().persistent().set(&key, &true);
        Ok(nullifier)
    }

    /// Has this nullifier already been claimed?
    pub fn is_spent(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Spent(nullifier))
    }

    fn verify_with(env: &Env, proof: &Proof, signals: &Vec<BytesN<32>>) -> bool {
        let bn = env.crypto().bn254();

        // Embedded verifying key.
        let ic0 = Bn254G1Affine::from_bytes(BytesN::from_array(env, &vk::IC[0]));
        let alpha = Bn254G1Affine::from_bytes(BytesN::from_array(env, &vk::ALPHA));
        let beta = Bn254G2Affine::from_bytes(BytesN::from_array(env, &vk::BETA));
        let gamma = Bn254G2Affine::from_bytes(BytesN::from_array(env, &vk::GAMMA));
        let delta = Bn254G2Affine::from_bytes(BytesN::from_array(env, &vk::DELTA));

        // vk_x = ic[0] + Σ signals[i] · ic[i+1]
        let mut vk_x = ic0;
        let mut i: u32 = 0;
        while i < signals.len() {
            let s = Bn254Fr::from_bytes(signals.get(i).unwrap());
            let ic = Bn254G1Affine::from_bytes(BytesN::from_array(env, &vk::IC[(i + 1) as usize]));
            vk_x = bn.g1_add(&vk_x, &bn.g1_mul(&ic, &s));
            i += 1;
        }

        let neg_a = Bn254G1Affine::from_bytes(proof.a.clone());
        let b = Bn254G2Affine::from_bytes(proof.b.clone());
        let c = Bn254G1Affine::from_bytes(proof.c.clone());

        // e(-A, B) · e(alpha, beta) · e(vk_x, gamma) · e(C, delta) == 1
        let vp1 = vec![env, neg_a, alpha, vk_x, c];
        let vp2 = vec![env, b, beta, gamma, delta];
        bn.pairing_check(vp1, vp2)
    }
}

#[cfg(test)]
mod fixture;
mod test;
