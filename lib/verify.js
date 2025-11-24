const path = require("path");
const fs = require("fs-extra");
const Web3 = require("web3");
const { execSync } = require("child_process");

async function verifyProof(input, folderPath, pvtKey) {
    // Paths
    const inputJsonPath = path.join(folderPath, "input.json");
    const vkeyjsonPath = path.join(folderPath, "vkey.json");
    const folderName = path.basename(folderPath);
    const wasmDir = path.join(folderPath, `${folderName}_js`);
    const wasmPath = path.join(wasmDir, `${folderName}.wasm`);
    const r1csPath = path.join(folderPath, `${folderName}.r1cs`);
    const zkeyPath = path.join(folderPath, "circuit_final.zkey");
    const proofPath = path.join(folderPath, "proof.json");
    const publicPath = path.join(folderPath, "public.json");

    // Step 1: Write input.json
    await fs.writeJson(inputJsonPath, input, { spaces: 2 });

    // Step 2: Generate proof using fullprove
    console.log("📦 Generating proof using fullprove...");

    execSync(
            `"${path.resolve(__dirname, "..", "bin", "zk-rust")}" --wasm "${wasmPath}" --r1cs "${r1csPath}" --json "${inputJsonPath}" --out "${vkeyjsonPath}"`,
            { 
                stdio: "inherit"
            }
        );

    const vkey = await fs.readJson(vkeyjsonPath);
    const verificationKeyHex = vkey.verification_key;
    const proofHex = vkey.proof;
    const publicInputsHex = vkey.public_inputs;

    const moveProjectPath = path.join(folderPath, "abcd");
    execSync(`sui move new abcd`,
        {
            cwd: folderPath,
        }
    );
    
    const moveFilePath = path.join(moveProjectPath, "sources", "abcd.move");
    let moveFileContent = `module abcd::verifier {
    
    use sui::groth16;

public fun groth16_bn254_test() {
    let pvk = groth16::prepare_verifying_key(&groth16::bn254(), &x"${verificationKeyHex}");
    let proof_points = groth16::proof_points_from_bytes(x"${proofHex}");
    let public_inputs = groth16::public_proof_inputs_from_bytes(x"${publicInputsHex}");
    assert!(groth16::verify_groth16_proof(&groth16::bn254(), &pvk, &public_inputs, &proof_points));
}

    }`

    await fs.writeFileSync(moveFilePath, moveFileContent);
    execSync(`sui move build`,
        {
            cwd: moveProjectPath,
            stdio: "inherit"
        }
    );

    console.log("✅ Proof generation and Move module creation completed.");

    execSync(`sui keytool import ${pvtKey} ed25519`);
    
    const outputDeployment = execSync(`sui client publish --gas-budget 100000000`,
        {
            cwd: moveProjectPath,
            stdio: "pipe"
        }
    ).toString();

    console.log(outputDeployment);

   const match = outputDeployment.match(/PackageID:\s*(0x[a-fA-F0-9]+)/);

    console.log("✅ Move module published.");
    const full = match[0];  
    const pkgId = full.substring(full.indexOf("0x"));
    console.log(pkgId);

    execSync(`sui client call --gas-budget 100000000 --package ${pkgId} --module verifier --function groth16_bn254_test`,
        {
            stdio: "inherit",
            cwd: moveProjectPath
        }
    )

    
}

module.exports = { verifyProof };