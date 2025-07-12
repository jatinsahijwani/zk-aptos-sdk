# zk-aptos-sdk 🧙‍♂️✨

**Write Circom. Compile. Deploy. Verify — all on Aptos, in just one click.**

A zero-setup toolkit to build, deploy, and verify ZK circuits using Circom — with **no Web3 knowledge required**.

---

## ✨ Features

- 🧠 Write simple Circom circuits
- 🛠 Compile to `.r1cs`, `.wasm`, `.zkey`
- 🧠 Generate `move verifier contract` with all the details automatically
- 🚀 Deploy verifier to **Aptos** with one command
- ✅ Verify proofs using a single JavaScript function
- 🧪 No Web3 scripting, no ABI handling — fully abstracted

---

## 📦 Installation

Install globally (recommended for CLI usage):

```bash
npm install zk-aptos-sdk
```

⚡ Usage

### ✅ Compile Circom circuit

```bash
npx zk-aptos-sdk compile <path-to-your-circom-file>
```

This command:

- Compiles your .circom file
- Runs Groth16 trusted setup
- Outputs .r1cs, .wasm, circuit_final.zkey
- All files are saved in a folder named after your circuit (e.g., ./yourCircuit/)

### ✅ Test Compiled Circom Circuit

```bash
npx zk-aptos-sdk test <path-to-generated-folder> <path-to-input.json>
```

This command:

- Tests the zk System produced by the compile command
- Uses inputs provided by the developer from input.json provided
- produces proof.json and public.json
- proof.json contains the smart contract parameters, which will be used to verify it onchain
- public.json contains human verifiable outputs and proofs

### ✅ Generate Move Verifier Contract

```bash
npx zk-aptos-sdk generate-move-verifier <path-to-generated-folder>
```

This command:

- This command:

- Generates a **Move-based Groth16 verifier smart contract** for Aptos.
- Uses the `.zkey` and `verification_key.json` files from the compiled folder.
- Automatically extracts all necessary zk circuit parameters:
  - Elliptic curve points (G1/G2 elements)
  - Alpha, beta, gamma, delta, and IC points
- Outputs a production-ready `.move` verifier contract:
  - Fully compatible with the Aptos zkSNARK verifier module.
  - Includes a `verify_proof` function that takes proof + public inputs.
- Enables **onchain zk proof verification** for any circuit compiled with `zk-aptos-sdk`.
- Circuit-specific — a new verifier is generated per compiled circuit.


### ✅ Deploy Move Verifier Contract

```bash
npx zk-aptos-sdk deploy <path-to-generated-folder>
```  

This command:

- Initializes a new Move project in a `zk-move/` subfolder within the provided folder.
- Automatically sets up the Aptos CLI using `aptos init` and `aptos move init`.
- Copies the generated `verifier_param.move` file into the Move project's `sources/` directory.
- Adds the deployer's address as `fresh_verifier` in `Move.toml`.
- Funds the Aptos account using the Devnet faucet (recommended).
- Publishes the verifier module to the Aptos blockchain via `aptos move publish`.
- Saves deployment metadata in `.zk-aptos.json`, including:
  - The deployed address
  - The verifier module path (`<address>::zkVerification::verify2`)
  - The deployment timestamp


### ✅ Verify ZK Proof Programmatically

You can verify a proof directly using a single function call.

```js
import { verify_proof } from "zk-aptos-sdk";

async function main()
{
    const result = await verify_proof({
        // Your input goes here
    },""<relative-path-to-generated-folder>"");

    console.log(result.verifierOnchain); //boolean value depicting if the verification happened onchain or not
    console.log(result.txnResponse); //transaction response if the verification happened onchain
    console.log(result.verfied); //human readable value of the verification output which was verified onchain
}

main();
```

- You pass input (in the form of json) & Relative path to the generated folder, which was generated during compilation process
- Automatically generates the proof and public signals
- Formats the calldata for the Move verifier
- Calls the deployed verifier contract on Aptos and returns the result

# You don’t need to manually use snarkjs or interact with web3 directly — the SDK abstracts it all for you.

## 🛠 Commands Overview

| Command                                                           | Description                                                                 |
|-------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `npx zk-aptos-sdk compile <path-to-circuit>`                      | Compiles the `.circom` file, runs Groth16 setup, and outputs a ZK-ready folder |
| `npx zk-aptos-sdk test <output-folder> <path-to-input.json>`      | Generates ZK proof (`proof.json`) and public signals (`public.json`) using the provided inputs |
| `npx zk-aptos-sdk generate-move-verifier <output-folder>`         | Generates a Move-based verifier smart contract (`verifier_param.move`) from the compiled circuit |
| `npx zk-aptos-sdk deploy <output-folder>`                         | Initializes a Move project and deploys the verifier contract to the Aptos blockchain |
| `verifyProof(input, "<relative-path-to-output-folder>")` *(programmatic only)* | Generates and verifies the proof using the Move verifier module deployed on Aptos |


