use ark_bn254::Bn254;
use ark_circom::CircomBuilder;
use ark_circom::CircomConfig;
use ark_bn254::Fr;
use ark_groth16::{Groth16, prepare_verifying_key};
use ark_serialize::CanonicalSerialize;
use ark_snark::SNARK;
use ark_std::rand::SeedableRng;
use ark_std::rand::rngs::StdRng;
use clap::Parser;

use serde_json::Value;
use serde_json::json;
use std::collections::HashMap;
use std::fs;

/// CLI argument structure
#[derive(Parser, Debug)]
#[command(author, version, about = "Groth16 Proof Generator using Circom + arkworks")]
struct Args {
    /// Path to .wasm file
    #[arg(long)]
    wasm: String,

    /// Path to .r1cs file
    #[arg(long)]
    r1cs: String,

    /// Path to JSON file containing circuit inputs
    #[arg(long)]
    json: String,

    /// Output JSON file path
    #[arg(long)]
    out: String,
}

#[tokio::main]
async fn main() {
    // Parse CLI arguments
    let args = Args::parse();

    // Read JSON file provided by user
    let json_str = fs::read_to_string(&args.json)
        .expect("Failed to read JSON file");

    // Parse JSON
    let parsed: Value = serde_json::from_str(&json_str)
        .expect("Failed to parse JSON file");
    println!("Parsed JSON: {}", parsed);

    let a_val = parsed.get("a")
        .and_then(|v| v.as_u64())
        .expect("JSON must contain 'a' as an unsigned integer") as u128;

    let b_val = parsed.get("b")
        .and_then(|v| v.as_u64())
        .expect("JSON must contain 'b' as an unsigned integer") as u128;

    println!("Using inputs: a = {}, b = {}", a_val, b_val);

    // Load the WASM and R1CS from CLI args
    let cfg = CircomConfig::<Fr>::new(&args.wasm, &args.r1cs).unwrap();
    let mut builder = CircomBuilder::new(cfg);

    // Dynamic inputs from JSON
    builder.push_input("a", a_val);
    builder.push_input("b", b_val);

    let circuit = builder.setup();

    // WARNING: not secure for production
    let mut rng: StdRng = SeedableRng::from_seed([0; 32]);
    let pk =
        Groth16::<Bn254>::generate_random_parameters_with_reduction(circuit, &mut rng).unwrap();

    let circuit = builder.build().unwrap();
    let public_inputs = circuit.get_public_inputs().unwrap();

    // Create proof
    let proof = Groth16::<Bn254>::prove(&pk, circuit, &mut rng).unwrap();

    // Verify proof
    let pvk = prepare_verifying_key(&pk.vk);
    let verified = Groth16::<Bn254>::verify_with_processed_vk(&pvk, &public_inputs, &proof).unwrap();
    assert!(verified);

    // Serialize verifying key
    let mut vk_bytes = Vec::new();
    pk.vk.serialize_compressed(&mut vk_bytes).unwrap();

    // Serialize proof
    let mut proof_bytes = Vec::new();
    proof.serialize_compressed(&mut proof_bytes).unwrap();

    // Serialize public inputs
    let mut public_inputs_bytes = Vec::new();
    for input in public_inputs.iter() {
        input.serialize_compressed(&mut public_inputs_bytes).unwrap();
    }

    // ---------------------------
    // ✅ WRITE OUTPUT AS JSON FILE
    // ---------------------------
    let output_json = json!({
        "verification_key": hex::encode(vk_bytes),
        "proof": hex::encode(proof_bytes),
        "public_inputs": hex::encode(public_inputs_bytes)
    });

    fs::write(&args.out, serde_json::to_string_pretty(&output_json).unwrap())
        .expect("Failed to write output JSON file");

    println!("\n✅ Output JSON saved to: {}", args.out);
}
