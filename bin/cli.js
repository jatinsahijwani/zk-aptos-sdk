#!/usr/bin/env node

const { program } = require('commander');
const { compileCircuit } = require('../lib/compile');
const { generateMoveVerifier } = require('../lib/generateMoveVerifier');

program
  .command('compile <circomFilePath>')
  .description('Compile a circom circuit')
  .action((circomFilePath) => {
    compileCircuit(circomFilePath);
  });

program
  .command('generate-move-verifier <folderPath>')
  .description('Generate Verifier.move from verification_key.json inside the given folder')
  .action((folderPath) => {
    generateMoveVerifier(folderPath);
  });

program.parse(process.argv);
