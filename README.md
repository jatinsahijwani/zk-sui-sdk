# zk-sui-sdk 

**Write Circom. Compile. Deploy. Verify — all in just one click, Powered by Sui**

A zero-setup toolkit to build, deploy, and verify ZK circuits using Circom — with **no Web3 knowledge required**.

---

## ✨ Features

- 🧠 Write simple **Circom** circuits  
- ⚙️ Compile to `.r1cs`, `.wasm`, `.zkey` — **no Solidity verifier needed**  
- 🚀 Automatically generate and deploy a **Sui Move** verifier module  
- 🔐 One-call proof verification using the `verifyProof()` function  
- 🪄 Fully abstracted workflow — no Move code, no CLI steps, no manual proof generation  

---

## 📦 Installation

Install in your project:

```bash
npm install zk-sui-sdk
```

⚡ Usage

### ✅ Compile Circom circuit

```bash
npx zk-sui-sdk compile <path-to-your-circom-file>
```

This command:

- Compiles your .circom file
- Runs Groth16 trusted setup
- Outputs .r1cs, .wasm, circuit_final.zkey
- All files are saved in a folder named after your circuit (e.g., ./yourCircuit/)


### ✅ Verify ZK Proof Programmatically

You can verify a proof directly using a single function call.

```js
const { verifyProof } = require("zk-sui-sdk");

const result = await verifyProof({
  input: {
    // Your circuit input goes here
  },
  "<relative-path-to-generated-folder>",
  "<PVT_KEY>"
});

console.log(result ? "✅ Valid proof" : "❌ Invalid proof");
```
- You pass the input (as a JSON) and the relative path to the compiled artifacts  
- Automatically runs the Rust prover script to generate proof-related constants  
- Produces a JSON containing verifier parameters and formatted values  
- Generates a Sui Move verifier module using these parameters  
- Deploys the Move module to Sui testnet using the provided private key  
- Automatically calls the on-chain verifier with your input and returns the result  


# You don’t need to manually use snarkjs or interact with web3 directly — the SDK abstracts it all for you.
# Just write the circom file, and let the SDK do the Heavy Lifting.

## 🪄 Zero-Setup Experience

You never need to touch:

- `snarkjs`
- Move code
- Sui CLI
- ABI encoding
- Contract deployment

Just write your Circom circuit —  
**the SDK handles everything else under the hood.**
