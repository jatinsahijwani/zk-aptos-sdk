const fs = require('fs');
const path = require('path');

function generateMoveVerifier(folderPath) {
  try {
    const vkPath = path.join(folderPath, "verification_key.json");
    const outputPath = path.join(folderPath, "Verifier.move");
    const templatePath = path.join(__dirname, "../templates/verifier.move.template");

    // Read and parse verification key
    const vk = JSON.parse(fs.readFileSync(vkPath, "utf8"));

    // Read template
    const template = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders
    const output = template
      .replace("{{vk_alpha_g1}}", JSON.stringify(vk.vk_alpha_1))
      .replace("{{vk_beta_g2}}", JSON.stringify(vk.vk_beta_2))
      .replace("{{vk_gamma_g2}}", JSON.stringify(vk.vk_gamma_2))
      .replace("{{vk_delta_g2}}", JSON.stringify(vk.vk_delta_2))
      .replace("{{vk_ic}}", JSON.stringify(vk.IC));

    // Write final Verifier.move
    fs.writeFileSync(outputPath, output, "utf8");

    console.log(`✅ Verifier.move generated at: ${outputPath}`);
  } catch (err) {
    console.error("❌ Failed to generate Verifier.move:", err.message);
  }
}

module.exports = {
  generateMoveVerifier,
};
