const aptos = require("aptos");
const fs = require("fs");
const { AptosClient, AptosAccount } = aptos;

// === CONFIG ===
const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const PRIVATE_KEY = "0xaa560a6315c51b8c7f7b6066419476c511880dc78a90070285260b1148bbf40c";
const MODULE_ADDRESS = "0xf548c3ad4d69d13e377f5fb28d18f511577a777145fdc098a2caf873f85c4d71";

// === INIT CLIENT ===
const client = new AptosClient(NODE_URL);
const account = AptosAccount.fromAptosAccountObject({
  privateKeyHex: PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY.slice(2) : PRIVATE_KEY,
});

// === MAIN ===
async function main() {
  // Load proof and public input
  const proof = JSON.parse(fs.readFileSync("../abcd/proof.json", "utf-8"));
  const publicInputs = JSON.parse(fs.readFileSync("../abcd/public.json", "utf-8"));
  console.log(proof);
  console.log(publicInputs);    

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
    function: `${MODULE_ADDRESS}::groth16::verify2`,
    arguments: [
      a_x,
      a_y,
      b_x1,
      b_y1,
      b_x2,
      b_y2,
      c_x,
      c_y,
      publicInputs, // <-- must be a JS array of u256 (as strings)
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
}

main().catch(console.error);
