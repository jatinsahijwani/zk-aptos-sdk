const path = require("path");
const fs = require("fs-extra");
const { execSync } = require("child_process");
const aptos = require("aptos");
const { AptosClient, AptosAccount } = aptos;
const YAML = require('yaml');


async function verify_proof(input, folderPath)
{
    try {
        const folderName = path.basename(folderPath);
        const inputJsonPath = path.join(folderPath, "input.json");
        const wasmDir = path.join(folderPath, `${folderName}_js`);
        const wasmPath = path.join(wasmDir, `${folderName}.wasm`);
        const zkeyPath = path.join(folderPath, "circuit_final.zkey");
        const proofPath = path.join(folderPath, "proof.json");
        const publicPath = path.join(folderPath, "public.json");
        await fs.writeJson(inputJsonPath, input, { spaces: 2 });

        console.log("📦 Generating proof using fullprove...");
        execSync(`snarkjs groth16 fullprove "${inputJsonPath}" "${wasmPath}" "${zkeyPath}" "${proofPath}" "${publicPath}"`,{ stdio: "inherit" });
        console.log("✅ Proof generated successfully!");
        
        const proof = await fs.readJson(proofPath);
        const publicSignals = await fs.readJson(publicPath);

        const deploymentPath = path.join(folderPath, ".zk-aptos.json");
        const deploymentData = await fs.readJson(deploymentPath);
        const contractAddress = deploymentData.address;

        const aptosAccountDetailsPath = path.join(folderPath, "zk-move", ".aptos", "config.yaml");
        const aptosAccountDetailsYAML = await fs.readFile(aptosAccountDetailsPath, "utf-8");
        const aptosAccountDetails = YAML.parse(aptosAccountDetailsYAML);
        
        const rawPrivateKey = (aptosAccountDetails.profiles.default.private_key);
        const privateKeyWith0x = rawPrivateKey.replace("ed25519-priv-", "");
        const privateKey = privateKeyWith0x.replace("0x", "");
        console.log("Private Key:", privateKey);
        
        const node_url = (aptosAccountDetails.profiles.default.rest_url);
        console.log("Node URL:", node_url);
        const client = new AptosClient(node_url);
        const account = AptosAccount.fromAptosAccountObject({privateKeyHex: privateKey});

        const a_x = proof.pi_a[0];
        const a_y = proof.pi_a[1];
        const b_x1 = proof.pi_b[0][0];
        const b_y1 = proof.pi_b[0][1];
        const b_x2 = proof.pi_b[1][0];
        const b_y2 = proof.pi_b[1][1];    
        const c_x = proof.pi_c[0];
        const c_y = proof.pi_c[1];

        const payload = {
          type: "entry_function_payload",
          function: `${contractAddress}::groth16::verify2`,
          arguments: [
            a_x,
            a_y,
            b_x1,
            b_y1,
            b_x2,
            b_y2,
            c_x,
            c_y,
            publicSignals, 
          ],
          type_arguments: [],
        };

        const txnRequest = await client.generateTransaction(account.address(), payload);
        const signedTxn = await client.signTransaction(account, txnRequest);
        const txnResponse = await client.submitTransaction(signedTxn);

        console.log("⏳ Waiting for confirmation:", txnResponse.hash);
        await client.waitForTransaction(txnResponse.hash);
        console.log("✅ Transaction executed!");
        console.log("🔗 Hash:", txnResponse.hash);
        console.log("📜 Transaction details:", txnResponse);

    }catch (error) {
        console.error("ZK verification failed due to :", error);
        throw error;
    }
}

module.exports = {
    verify_proof
};