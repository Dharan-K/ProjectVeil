#![cfg(test)]
use crate::fixture::*;
use crate::{Proof, VeilVerifier, VeilVerifierClient};
use soroban_sdk::{BytesN, Env, Vec};

fn make_proof(env: &Env) -> Proof {
    Proof {
        a: BytesN::from_array(env, &PROOF_A),
        b: BytesN::from_array(env, &PROOF_B),
        c: BytesN::from_array(env, &PROOF_C),
    }
}

fn make_signals(env: &Env) -> Vec<BytesN<32>> {
    let mut v = Vec::new(env);
    for s in SIGNALS.iter() {
        v.push_back(BytesN::from_array(env, s));
    }
    v
}

fn deploy(env: &Env) -> VeilVerifierClient<'_> {
    let id = env.register(VeilVerifier, ());
    VeilVerifierClient::new(env, &id)
}

#[test]
fn verifies_valid_proof() {
    let env = Env::default();
    let client = deploy(&env);
    assert!(client.verify(&make_proof(&env), &make_signals(&env)));
}

#[test]
fn rejects_tampered_signal() {
    let env = Env::default();
    let client = deploy(&env);
    let mut sigs = make_signals(&env);
    let mut bad = SIGNALS[2];
    bad[31] ^= 0x01;
    sigs.set(2, BytesN::from_array(&env, &bad));
    assert!(!client.verify(&make_proof(&env), &sigs));
}

#[test]
fn claim_spends_nullifier_once() {
    let env = Env::default();
    let client = deploy(&env);

    let nh = client.claim(&make_proof(&env), &make_signals(&env));
    assert_eq!(nh, BytesN::from_array(&env, &SIGNALS[1]));
    assert!(client.is_spent(&BytesN::from_array(&env, &SIGNALS[1])));

    // Second claim with the same nullifier must be rejected.
    let res = client.try_claim(&make_proof(&env), &make_signals(&env));
    assert!(res.is_err());
}
