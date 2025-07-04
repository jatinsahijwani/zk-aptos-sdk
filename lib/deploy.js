const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const YAML = require('yaml');

function deploy(folderPath) {
  const absPath = path.resolve(folderPath);
  const deployDir = path.join(absPath, 'zk-move');
  const moduleName = 'zkVerification';

  // Step 1: Create zk-move dir if not exists
  if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir);

  console.log(`⚠️  NOTE:
Please use the Devnet network for now so that the entire deployment flow (including funding) works smoothly.

If you're using Testnet or Mainnet, do NOT create a new account.
Instead, provide your own private key in the Aptos CLI config so that the account can be loaded.

🌐 Devnet faucet works with CLI.
🌐 Testnet faucet must be used via: https://aptos.dev/network/faucet
`);


  // Step 2: Run aptos init
  console.log('🔧 Initializing Aptos...');
  execSync(`aptos init --assume-yes --profile default`, { cwd: deployDir, stdio: 'inherit' });

  // Step 3: Init Move module
  console.log('🧱 Creating Move project...');
  execSync(`aptos move init --name ${moduleName}`, { cwd: deployDir, stdio: 'inherit' });

  // Step 4: Copy verifier_script.move into sources
  const verifierScriptPath = path.join(folderPath, 'verifier_param.move');
  const destPath = path.join(deployDir, 'sources', 'verifier_script.move');
  fs.copyFileSync(verifierScriptPath, destPath);
  console.log(`✅ Copied verifier_script.move to sources`);


  const configPath = path.join(deployDir, '.aptos', 'config.yaml');
  const configText = fs.readFileSync(configPath, 'utf8');
  const config = YAML.parse(configText);
  const defaultProfile = config.profiles?.default;
if (defaultProfile && !defaultProfile.faucet_url) {
  defaultProfile.faucet_url = "https://faucet.devnet.aptoslabs.com";
  fs.writeFileSync(configPath, YAML.stringify(config));
  console.log('🌊 Added faucet_url to aptos.yaml');
}
  const address = '0x' + config.profiles?.default?.account;
  console.log(`📦 Using address: ${address}`);

  const moveTomlPath = path.join(deployDir, 'Move.toml');
  let moveToml = fs.readFileSync(moveTomlPath, 'utf8');
  if (!moveToml.includes('[addresses]')) {
        moveToml += `\n[addresses]\nfresh_verifier = "${address}"\n`;
  } else if (!moveToml.includes('fresh_verifier')) {
    moveToml = moveToml.replace('[addresses]', `[addresses]\nfresh_verifier = "${address}"`);
}

fs.writeFileSync(moveTomlPath, moveToml);


 moveToml = fs.readFileSync(moveTomlPath, 'utf8');


 console.log('💰 Funding account via faucet...');
execSync(`aptos account fund-with-faucet --profile default`, { cwd: deployDir, stdio: 'inherit' });


  // Step 5: Publish
  console.log('🚀 Publishing Move module...');
  execSync(`aptos move publish --profile default`, { cwd: deployDir, stdio: 'inherit' });

  // Step 7: Save deployment metadata
  const metadata = {
    deployedAt: new Date().toISOString(),
    address,
    folder: folderPath,
    module: `${address}::${moduleName}::verify2`,
    projectDir: deployDir
  };

  const metaFile = path.join(folderPath, '.zk-aptos.json');
  fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));

  console.log(`📝 Deployment metadata saved to .zk-aptos.json`);
  console.log(`✅ Deployment complete! Module: ${metadata.module}`);
}

module.exports = { deploy };
