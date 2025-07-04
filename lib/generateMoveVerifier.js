const fs = require('fs');
const path = require('path');

function toU256(val) {
  return `${val}u256`;
}

function writeG1(write, varName, x, y) {
  write(`        let ${varName}_x = ${toU256(x)};`);
  write(`        let ${varName}_y = ${toU256(y)};`);
  write(`        let ${varName}_bytes = bcs::to_bytes<u256>(&${varName}_x);`);
  write(`        let ${varName}_y_bytes = bcs::to_bytes<u256>(&${varName}_y);`);
  write(`        vector::append(&mut ${varName}_bytes, ${varName}_y_bytes);`);
  write(`        let ${varName} = std::option::extract(&mut deserialize<bn254_algebra::G1, bn254_algebra::FormatG1Uncompr>(&${varName}_bytes));`);
  write('');
}

function writeG2(write, varName, x1, y1, x2, y2) {
  write(`        let ${varName}_x1 = ${toU256(x1)};`);
  write(`        let ${varName}_y1 = ${toU256(y1)};`);
  write(`        let ${varName}_x2 = ${toU256(x2)};`);
  write(`        let ${varName}_y2 = ${toU256(y2)};`);
  write(`        let ${varName}_bytes = bcs::to_bytes<u256>(&${varName}_x1);`);
  write(`        let ${varName}_y1_bytes = bcs::to_bytes<u256>(&${varName}_y1);`);
  write(`        let ${varName}_x2_bytes = bcs::to_bytes<u256>(&${varName}_x2);`);
  write(`        let ${varName}_y2_bytes = bcs::to_bytes<u256>(&${varName}_y2);`);
  write(`        vector::append(&mut ${varName}_bytes, ${varName}_y1_bytes);`);
  write(`        vector::append(&mut ${varName}_bytes, ${varName}_x2_bytes);`);
  write(`        vector::append(&mut ${varName}_bytes, ${varName}_y2_bytes);`);
  write(`        let ${varName} = std::option::extract(&mut deserialize<bn254_algebra::G2, bn254_algebra::FormatG2Uncompr>(&${varName}_bytes));`);
  write('');
}

function generateMoveVerifier(folderPath) {
  const vkPath = path.join(folderPath, 'verification_key.json');
  const outPath = path.join(folderPath, 'verifier_param.move');

  const vk = JSON.parse(fs.readFileSync(vkPath, 'utf-8'));
  const out = fs.createWriteStream(outPath);
  const write = (line = '') => out.write(line + '\n');

  const [vk_alpha_x, vk_alpha_y] = vk.vk_alpha_1;
  const [[beta_x1, beta_y1], [beta_x2, beta_y2]] = vk.vk_beta_2;
  const [[gamma_x1, gamma_y1], [gamma_x2, gamma_y2]] = vk.vk_gamma_2;

  // === Header ===
  write(`module fresh_verifier::groth16 {`);
  write(`    use aptos_std::crypto_algebra::{Element, from_u64, multi_scalar_mul, eq, pairing, add, zero};`);
  write(`    use aptos_std::crypto_algebra::{deserialize};`);
  write(`    use aptos_std::bn254_algebra;`);
  write(`    use std::bcs;`);
  write(`    use std::vector;`);
  write('');

  // === Proof verifier function ===
  write(`    public fun verify_proof<G1,G2,Gt,S>(`);
  write(`        vk_alpha_g1: &Element<G1>,`);
  write(`        vk_beta_g2: &Element<G2>,`);
  write(`        vk_gamma_g2: &Element<G2>,`);
  write(`        vk_delta_g2: &Element<G2>,`);
  write(`        vk_uvw_gamma_g1: &vector<Element<G1>>,`);
  write(`        public_inputs: &vector<Element<S>>,`);
  write(`        proof_a: &Element<G1>,`);
  write(`        proof_b: &Element<G2>,`);
  write(`        proof_c: &Element<G1>,`);
  write(`    ): bool {`);
  write(`        let left = pairing<G1,G2,Gt>(proof_a, proof_b);`);
  write(`        let scalars = vector[from_u64<S>(1)];`);
  write(`        std::vector::append(&mut scalars, *public_inputs);`);
  write(`        let right = zero<Gt>();`);
  write(`        let right = add(&right, &pairing<G1,G2,Gt>(vk_alpha_g1, vk_beta_g2));`);
  write(`        let right = add(&right, &pairing(&multi_scalar_mul(vk_uvw_gamma_g1, &scalars), vk_gamma_g2));`);
  write(`        let right = add(&right, &pairing(proof_c, vk_delta_g2));`);
  write(`        eq(&left, &right)`);
  write(`    }`);
  write('');

  // === Entry Function Signature ===
  write(`    public entry fun verify2(`);
  write(`        a_x: u256, a_y: u256,`);
  write(`        b_x1: u256, b_y1: u256, b_x2: u256, b_y2: u256,`);
  write(`        c_x: u256, c_y: u256,`);
  write(`        public_inputs_raw: vector<u256>`);
  write(`    ) {`);

  // === Reconstruct proof elements ===
  write(`        let a_bytes = bcs::to_bytes<u256>(&a_x);`);
  write(`        let a_y_bytes = bcs::to_bytes<u256>(&a_y);`);
  write(`        vector::append(&mut a_bytes, a_y_bytes);`);
  write(`        let a = std::option::extract(&mut deserialize<bn254_algebra::G1, bn254_algebra::FormatG1Uncompr>(&a_bytes));`);
  write('');

  write(`        let b_bytes = bcs::to_bytes<u256>(&b_x1);`);
  write(`        let b_y1_bytes = bcs::to_bytes<u256>(&b_y1);`);
  write(`        let b_x2_bytes = bcs::to_bytes<u256>(&b_x2);`);
  write(`        let b_y2_bytes = bcs::to_bytes<u256>(&b_y2);`);
  write(`        vector::append(&mut b_bytes, b_y1_bytes);`);
  write(`        vector::append(&mut b_bytes, b_x2_bytes);`);
  write(`        vector::append(&mut b_bytes, b_y2_bytes);`);
  write(`        let b = std::option::extract(&mut deserialize<bn254_algebra::G2, bn254_algebra::FormatG2Uncompr>(&b_bytes));`);
  write('');

  write(`        let c_bytes = bcs::to_bytes<u256>(&c_x);`);
  write(`        let c_y_bytes = bcs::to_bytes<u256>(&c_y);`);
  write(`        vector::append(&mut c_bytes, c_y_bytes);`);
  write(`        let c = std::option::extract(&mut deserialize<bn254_algebra::G1, bn254_algebra::FormatG1Uncompr>(&c_bytes));`);
  write('');

  // === Deserialize public inputs from u256 vector ===
  write(`        let public_inputs = vector::empty<Element<bn254_algebra::Fr>>();`);
  write(`        let len = vector::length(&public_inputs_raw);`);
  write(`        let i = 0;`);
  write(`        while (i < len) {`);
  write(`            let val = vector::borrow(&public_inputs_raw, i);`);
  write(`            let bytes = bcs::to_bytes<u256>(val);`);
  write(`            let fr = std::option::extract(&mut deserialize<bn254_algebra::Fr, bn254_algebra::FormatFrLsb>(&bytes));`);
  write(`            vector::push_back(&mut public_inputs, fr);`);
  write(`            i = i + 1;`);
  write(`        };`);
  write('');

  // === Hardcoded VK ===
  writeG1(write, 'vk_alpha', vk_alpha_x, vk_alpha_y);
  writeG2(write, 'vk_beta', beta_x1, beta_y1, beta_x2, beta_y2);
  writeG2(write, 'vk_gamma', gamma_x1, gamma_y1, gamma_x2, gamma_y2);
  write(`        let vk_delta = std::option::extract(&mut deserialize<bn254_algebra::G2, bn254_algebra::FormatG2Uncompr>(&vk_gamma_bytes));`);
  write('');

  // === vk_gamma_abc (IC points) ===
  vk.IC.forEach((ic, i) => {
    const [x, y] = ic;
    writeG1(write, `vk_gamma_abc_${i}`, x, y);
  });

  const abcList = vk.IC.map((_, i) => `vk_gamma_abc_${i}`).join(', ');
  write(`        let vk_gamma_abc = vector[${abcList}];`);
  write('');

  // === Final call ===
  write(`        assert!(verify_proof<bn254_algebra::G1, bn254_algebra::G2, bn254_algebra::Gt, bn254_algebra::Fr>(`);
  write(`            &vk_alpha, &vk_beta, &vk_gamma, &vk_delta, &vk_gamma_abc, &public_inputs, &a, &b, &c`);
  write(`        ), 100);`);
  write(`    }`);
  write(`}`);
  out.end();

  console.log(`✅ verifier_param.move generated at ${outPath}`);
}


module.exports = { generateMoveVerifier };
